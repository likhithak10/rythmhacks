#include <Arduino.h>
#include <ArduinoBLE.h>
#include <Arduino_LSM9DS1.h>
#include <PDM.h>
#include <Arduino_LPS22HB.h>

#define FALL_SERVICE_UUID       "12345678-1234-5678-1234-56789abcdef0"
#define FALL_EVENT_CHAR_UUID    "12345678-1234-5678-1234-56789abcdef2"

BLEService fallService(FALL_SERVICE_UUID);
BLEStringCharacteristic fallEventChar(FALL_EVENT_CHAR_UUID, BLERead | BLENotify, 220);

static const float G1                = 1.0f;
static const float IMPACT_G_DELTA    = 1.6f;
static const float GYRO_DPS_THRESH   = 300.0f;
static const float INACTIVITY_VAR_G  = 0.018f;
static const float INACTIVITY_SEC    = 1.4f;

static const int   PDM_SAMPLE_RATE   = 16000;
static const int   PDM_CHANNELS      = 1;
static const float ENV_ATTACK        = 0.30f;
static const float ENV_RELEASE       = 0.02f;
static const float BASELINE_LEARN    = 0.0015f;

static const float AUDIO_PEAK_FLOOR  = 550.0f;
static const float AUDIO_RATIO_GATE  = 6.0f;

static const float BURST_DENV_FLOOR  = 90.0f;
static const float BURST_RATIO_GATE  = 1.8f;
static const uint32_t BURST_WINDOW_MS= 250;

static const float OVERRIDE_MAXG_G   = 4.8f;
static const float OVERRIDE_GYRO_DPS = 500.0f;

static const bool  REQUIRE_LYING     = true;
static const float LYING_TILT_DEG    = 55.0f;
static const uint32_t LYING_CHECK_MS = 800;

static const uint32_t POST_IMPACT_AUDIO_MS = 300;
static const uint32_t COOLDOWN_MS          = 4000;

#define PDM_BUF_SAMPLES 512
volatile int16_t pdmBuf[PDM_BUF_SAMPLES];

volatile float g_env = 0.0f;
volatile float g_env_prev = 0.0f;
volatile float g_baseline = 50.0f;
volatile float g_envPeak = 0.0f;

void onPDMData() {
  int bytesAvail = PDM.available();
  if (bytesAvail <= 0) return;
  int samples = bytesAvail / 2;
  if (samples > PDM_BUF_SAMPLES) samples = PDM_BUF_SAMPLES;

  PDM.read((void*)pdmBuf, samples * 2);

  long accAbs = 0;
  for (int i = 0; i < samples; ++i) {
    int16_t s = pdmBuf[i];
    accAbs += (s >= 0 ? s : -s);
  }
  float meanAbs = (samples > 0) ? (float)accAbs / samples : 0.0f;

  float target = meanAbs;
  float prev = g_env;
  float alpha = (target > prev) ? ENV_ATTACK : ENV_RELEASE;
  float env = (1.0f - alpha) * prev + alpha * target;

  g_env_prev = prev;
  g_env = env;

  if (env > g_envPeak) g_envPeak = env;
}

static const int VAR_WIN = 64;
float varBuf[VAR_WIN];
int   varIdx = 0, varCount = 0;

float computeVariance() {
  int n = varCount < VAR_WIN ? varCount : VAR_WIN;
  if (n <= 1) return 0.0f;
  float sum = 0.0f;
  for (int i = 0; i < n; ++i) sum += varBuf[i];
  float mean = sum / n;
  float vsum = 0.0f;
  for (int i = 0; i < n; ++i) { float d = varBuf[i] - mean; vsum += d*d; }
  return vsum / (n - 1);
}

float angleFromVerticalDeg(float ax, float ay, float az) {
  float mag = sqrtf(ax*ax + ay*ay + az*az);
  if (mag < 1e-3f) return 0.0f;
  float cosTheta = fabsf(az) / mag;
  cosTheta = fminf(1.0f, fmaxf(0.0f, cosTheta));
  return acosf(cosTheta) * 180.0f / PI;
}

enum DetectState { IDLE, CANDIDATE, MONITOR, COOLDOWN };
DetectState state = IDLE;

uint32_t impactMs = 0;
float    impactMaxG = 0.0f;
float    impactGyroPeak = 0.0f;
float    postAudioPeak = 0.0f;
float    postAudioRatio = 0.0f;

float    postAudioRisePeak = 0.0f;
float    postAudioFastRef  = 0.0f;
bool     postAudioBurst    = false;

uint32_t inactivityStartMs = 0;
bool     inactivityLock = false;

String makeFallJson(unsigned long nowMs, float maxG, float gyroPeak,
                    float inactivity_s, float audioPeak, float audioRatio, int confidence) {
  char buf[220];
  snprintf(buf, sizeof(buf),
    "{\"type\":\"fall\",\"ts\":%lu,"
    "\"features\":{\"maxG\":%.2f,\"gyroPeak\":%.1f,"
    "\"inactivity_s\":%.2f,\"audioPeak\":%.1f,\"audioRatio\":%.2f,\"confidence\":%d}}",
    nowMs, maxG, gyroPeak, inactivity_s, audioPeak, audioRatio, confidence
  );
  return String(buf);
}

void sendFallEvent(float maxG, float gyroPeak, float inactivity_s, float audioPeak, float audioRatio, int confidence) {
  String json = makeFallJson(millis(), maxG, gyroPeak, inactivity_s, audioPeak, audioRatio, confidence);
  fallEventChar.writeValue(json);
  Serial.print("[BLE] FallEvent: ");
  Serial.println(json);
}

int computeConfidence(float maxG, float gyroPk, float inact_s, float audPk, float audRatio) {
  float c = 0.0f;
  c += min(1.0f, max(0.0f, (maxG - (1.0f + IMPACT_G_DELTA)) / 1.2f)) * 0.35f;
  c += min(1.0f, max(0.0f, (gyroPk - GYRO_DPS_THRESH) / 200.0f)) * 0.20f;
  c += min(1.0f, max(0.0f, (inact_s - INACTIVITY_SEC) / 1.0f)) * 0.20f;
  float aScore = max( (audPk >= AUDIO_PEAK_FLOOR) ? 0.5f : 0.0f,
                      min(1.0f, (audRatio - AUDIO_RATIO_GATE) / 5.0f) );
  c += aScore * 0.25f;
  int pct = (int)roundf(100.0f * min(1.0f, max(0.0f, c)));
  return pct;
}

void bleStartAdvertising() {
  BLE.setDeviceName("Nano33BLE-Fall");
  BLE.setLocalName("Nano33BLE-Fall");
  BLE.setAdvertisedService(fallService);

  fallService.addCharacteristic(fallEventChar);
  BLE.addService(fallService);

  fallEventChar.writeValue(String("{}"));
  BLE.advertise();
  Serial.println("[BLE] Advertising");
}

namespace ProximityPress {
const float EMA_ALPHA         = 0.05f;
const float PRESS_THRESH_PA   = 8.0f;
const float RELEASE_THRESH_PA = 3.0f;
const float MIN_PEAK_PA       = 12.0f;
const uint32_t HOLD_MS        = 1000;
const uint32_t SAMPLE_US      = 20000;

float p_ema = NAN, p_base = NAN;
bool  baselineLocked = false;
uint32_t baselineT0 = 0;

enum PState { P_IDLE, P_PRESSING, P_HELD };
PState pState = P_IDLE;
uint32_t pressStartMs = 0;
uint32_t lastSampleUs = 0;
float    peakDeltaPa = 0.0f;

void proximitySetup() {
  if (!BARO.begin()) {
    Serial.println("[PROX] ERR: LPS22HB not found (pressure press disabled)");
    return;
  }
  baselineT0 = millis();
  Serial.println("[PROX] Press firmly on the sensor vent for ≥1s to trigger");
}

void sendProximityJson(float deltaPa, uint32_t heldMs) {
  char buf[180];
  snprintf(buf, sizeof(buf),
    "{\"type\":\"proximity\",\"ts\":%lu,\"status\":\"person_in_front\","
    "\"features\":{\"deltaPa\":%.3f,\"held_ms\":%lu}}",
    millis(), deltaPa, (unsigned long)heldMs
  );
  String json = String(buf);
  Serial.println(json);
  fallEventChar.writeValue(json);
}

void proximityTick() {
  uint32_t nowUs = micros();
  if (nowUs - lastSampleUs < SAMPLE_US) return;
  lastSampleUs = nowUs;

  float p_hPa = BARO.readPressure();
  float p_Pa  = p_hPa * 100.0f;
  if (isnan(p_ema)) p_ema = p_Pa;
  p_ema = EMA_ALPHA * p_Pa + (1.0f - EMA_ALPHA) * p_ema;

  if (!baselineLocked && (millis() - baselineT0 > 2000)) {
    p_base = p_ema;
    baselineLocked = true;
  }
  if (!baselineLocked) return;

  float deltaPa = p_ema - p_base;
  float absDelta = fabs(deltaPa);

  switch (pState) {
    case P_IDLE:
      peakDeltaPa = 0.0f;
      if (absDelta >= PRESS_THRESH_PA) {
        pState = P_PRESSING;
        pressStartMs = millis();
        peakDeltaPa = absDelta;
      }
      break;

    case P_PRESSING: {
      if (absDelta < RELEASE_THRESH_PA) {
        pState = P_IDLE;
      } else {
        if (absDelta > peakDeltaPa) peakDeltaPa = absDelta;

        if ((millis() - pressStartMs) >= HOLD_MS) {
          if (peakDeltaPa >= MIN_PEAK_PA) {
            pState = P_HELD;
            sendProximityJson(deltaPa, millis() - pressStartMs);
          } else {
            pState = P_HELD;
          }
        }
      }
      break;
    }

    case P_HELD:
      if (absDelta < RELEASE_THRESH_PA) {
        pState = P_IDLE;
      }
      break;
  }
}
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000) {}

  Serial.println("\n=== Fall Detection (IMU + Mic, sound-burst sensitive) → BLE JSON ===");

  if (!BLE.begin()) { Serial.println("[BLE] FATAL begin failed"); for(;;); }
  bleStartAdvertising();

  if (!IMU.begin()) { Serial.println("[IMU] FATAL begin failed"); for(;;); }
  Serial.print("[IMU] Accel rate: "); Serial.println(IMU.accelerationSampleRate());
  Serial.print("[IMU] Gyro  rate: "); Serial.println(IMU.gyroscopeSampleRate());

  PDM.onReceive(onPDMData);
  if (!PDM.begin(PDM_CHANNELS, PDM_SAMPLE_RATE)) {
    Serial.println("[MIC] WARN begin failed (audio gating disabled → override only)");
  } else {
    PDM.setGain(45);
    Serial.println("[MIC] OK @16kHz, gain=45");
  }

  ProximityPress::proximitySetup();
}

void loop() {
  BLE.poll();

  float ax=0, ay=0, az=0, gx=0, gy=0, gz=0;
  bool aOK = IMU.accelerationAvailable();
  bool gOK = IMU.gyroscopeAvailable();

  uint32_t now = millis();
  float magG = 0.0f, gyroMag = 0.0f;

  if (aOK) {
    IMU.readAcceleration(ax, ay, az);
    magG = sqrtf(ax*ax + ay*ay + az*az);
    varBuf[varIdx] = magG;
    varIdx = (varIdx + 1) % VAR_WIN;
    if (varCount < VAR_WIN) varCount++;
  }
  if (gOK) {
    IMU.readGyroscope(gx, gy, gz);
    gyroMag = sqrtf(gx*gx + gy*gy + gz*gz);
  }

  if (state == IDLE) {
    g_baseline = (1.0f - BASELINE_LEARN) * g_baseline + BASELINE_LEARN * g_env;
  }

  switch (state) {
    case IDLE: {
      bool impactAccel = (magG - G1) > IMPACT_G_DELTA;
      bool impactGyro  = gyroMag > GYRO_DPS_THRESH;
      if (impactAccel || impactGyro) {
        state = CANDIDATE;
        impactMs = now;
        impactMaxG = magG;
        impactGyroPeak = gyroMag;

        g_envPeak = 0.0f;
        postAudioPeak = 0.0f;
        postAudioRatio = 0.0f;
        postAudioRisePeak = 0.0f;
        postAudioFastRef  = g_env;
        postAudioBurst = false;

        inactivityLock = false;
        inactivityStartMs = 0;
        Serial.println("[STATE] CANDIDATE (impact)");
      }
    } break;

    case CANDIDATE: {
      impactMaxG = max(impactMaxG, magG);
      impactGyroPeak = max(impactGyroPeak, gyroMag);

      if (now - impactMs <= POST_IMPACT_AUDIO_MS) {
        float env = g_env;
        if (env > postAudioPeak) postAudioPeak = env;
        float ratio = (g_baseline > 1.0f) ? (env / g_baseline) : 0.0f;
        if (ratio > postAudioRatio) postAudioRatio = ratio;

        float dEnv = env - g_env_prev;
        if (dEnv > postAudioRisePeak) postAudioRisePeak = dEnv;

        float localRef = max(1.0f, postAudioFastRef * 0.9f + env * 0.1f);
        postAudioFastRef = localRef;
        float burstRatio = env / localRef;

        if ((dEnv >= BURST_DENV_FLOOR) || (burstRatio >= BURST_RATIO_GATE)) {
          postAudioBurst = true;
        }
      } else {
        state = MONITOR;
        Serial.println("[STATE] MONITOR (inactivity)");
      }
    } break;

    case MONITOR: {
      float var = computeVariance();
      bool still = var < INACTIVITY_VAR_G;

      if (still && !inactivityLock) { inactivityLock = true; inactivityStartMs = now; }
      if (!still && inactivityLock) { inactivityLock = false; inactivityStartMs = 0; }
      bool inactivityOK = inactivityLock && (now - inactivityStartMs >= (uint32_t)(INACTIVITY_SEC * 1000.0f));

      bool audioOKPrimary = (postAudioPeak >= AUDIO_PEAK_FLOOR) && (postAudioRatio >= AUDIO_RATIO_GATE);
      bool audioOKBurst   = postAudioBurst && (now - impactMs <= (POST_IMPACT_AUDIO_MS + BURST_WINDOW_MS));
      bool audioOK        = audioOKPrimary || audioOKBurst;

      bool overrideOK = (impactMaxG >= OVERRIDE_MAXG_G) && (impactGyroPeak >= OVERRIDE_GYRO_DPS);

      bool lyingOK = true;
      if (REQUIRE_LYING && (now - inactivityStartMs) >= LYING_CHECK_MS && inactivityLock) {
        float lax, lay, laz;
        if (IMU.accelerationAvailable()) {
          IMU.readAcceleration(lax, lay, laz);
          float tiltDeg = angleFromVerticalDeg(lax, lay, laz);
          lyingOK = (tiltDeg >= LYING_TILT_DEG);
        }
      }

      if (inactivityOK && (audioOK || overrideOK) && lyingOK) {
        float inact_s = (now - inactivityStartMs) / 1000.0f;
        int conf = computeConfidence(impactMaxG, impactGyroPeak, inact_s, postAudioPeak, postAudioRatio);
        if (!audioOKPrimary && audioOKBurst) conf = max(conf, 70);
        if (!audioOK && overrideOK)          conf = max(60, conf - 10);

        sendFallEvent(impactMaxG, impactGyroPeak, inact_s, postAudioPeak, postAudioRatio, conf);
        state = COOLDOWN;
        Serial.println("[STATE] COOLDOWN");
      }

      if (now - impactMs > 3200) {
        state = IDLE;
        impactMaxG = impactGyroPeak = 0.0f;
        postAudioPeak = postAudioRatio = 0.0f;
        postAudioRisePeak = 0.0f; postAudioFastRef = 0.0f; postAudioBurst = false;
        inactivityLock = false;
        inactivityStartMs = 0;
        Serial.println("[STATE] IDLE (timeout)");
      }
    } break;

    case COOLDOWN: {
      if (now - impactMs > COOLDOWN_MS) {
        state = IDLE;
        impactMaxG = impactGyroPeak = 0.0f;
        postAudioPeak = postAudioRatio = 0.0f;
        postAudioRisePeak = 0.0f; postAudioFastRef = 0.0f; postAudioBurst = false;
        inactivityLock = false;
        inactivityStartMs = 0;
        Serial.println("[STATE] IDLE");
      }
    } break;
  }

  ProximityPress::proximityTick();
}
