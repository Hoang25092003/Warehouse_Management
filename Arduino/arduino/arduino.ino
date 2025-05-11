#include <Wire.h>            //I2C
#include <SoftwareSerial.h>  //UART

#define GM65_RX 10
#define GM65_TX 11
#define MAX_BARCODE_LENGTH 30
#define I2C_BUFFER_SIZE 32

<<<<<<< HEAD
#define WHITE_LED_PIN 3   // Chân White LED chỉ báo
#define YELLOW_LED_PIN 4  // Chân Yellow LED chỉ báo
#define RED_PIN 5         // GPIO điều khiển LED đỏ
#define GREEN_PIN 6       // GPIO điều khiển LED xanh lá
#define BLUE_PIN 7        // GPIO điều khiển LED xanh dương
=======
#define WHITE_LED_PIN 3 // Chân White LED chỉ báo
#define YELLOW_LED_PIN 4 // Chân Yellow LED chỉ báo
#define RED_PIN 5    // GPIO điều khiển LED đỏ
#define GREEN_PIN 6 // GPIO điều khiển LED xanh lá
#define BLUE_PIN 7  // GPIO điều khiển LED xanh dương
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33

SoftwareSerial mySerial(GM65_RX, GM65_TX);           //Thiêt lập cổng UART
char barcodeBuffer[MAX_BARCODE_LENGTH + 1] = { 0 };  // Mảng lưu mã vạch
volatile bool newDataAvailable = false;              // flag dữ liệu mới
unsigned long lastCharTime = 0;
const unsigned long BARCODE_TIMEOUT = 100;  // 100ms timeout

// Nhận dữ liệu từ ESP để hiện đèn chỉ báo
<<<<<<< HEAD
char device_type[20] = { 0 };
bool successFlag = false;
bool failureFlag = false;
bool legFlag = false;

// Đèn chỉ báo
unsigned long previousMillisWhite = 0;
unsigned long previousMillisYellow = 0;
int blinkCountWhite = 0;
int blinkStateWhite = LOW;
bool isBlinkingWhite = false;

int blinkCountYellow = 0;
int blinkStateYellow = LOW;
bool isBlinkingYellow = false;
=======
char device_type[20] = {0};
bool successFlag = false;
bool failureFlag = false;
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33

void setup() {
  Serial.begin(9600);
  mySerial.begin(9600);

  Wire.begin(8);  // Slave địa chỉ 8
  Wire.onRequest(requestEvent);
  Wire.onReceive(receiveEvent);
<<<<<<< HEAD

=======
  
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  // RGB LED
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  // nofity LED
  setupWhiteLED();
  setupYellowLED();
  Serial.println("Arduino Ready - I2C Slave Address: 8");
}

void loop() {
  readBarcode();
  updateWhiteBlink();
  updateYellowBlink();
  delay(50);  // Tránh đọc quá nhanh
}

void readBarcode() {
  static byte idx = 0;

  while (mySerial.available()) {
    char c = mySerial.read();
    lastCharTime = millis();

    if (c == '\n' || c == '\r') {
      if (idx > 0) {
        barcodeBuffer[idx] = '\0';
        Serial.print("Scanned: ");
        Serial.println(barcodeBuffer);
        newDataAvailable = true;
      }
      idx = 0;
    } else if (idx < MAX_BARCODE_LENGTH) {
      barcodeBuffer[idx++] = c;
    }
  }

  // Timeout reset
  if (idx > 0 && millis() - lastCharTime > BARCODE_TIMEOUT) {
    idx = 0;
    memset(barcodeBuffer, 0, sizeof(barcodeBuffer));  // xóa buffer
  }
}

void requestEvent() {
  if (newDataAvailable) {
    byte len = strlen(barcodeBuffer);
    if (len > I2C_BUFFER_SIZE - 1) len = I2C_BUFFER_SIZE - 1;  // đảm bảo không vượt quá buffer

    Wire.write(barcodeBuffer, len);  // gửi I2C
    Serial.print("Sent to ESP: ");
    Serial.println(barcodeBuffer);

    newDataAvailable = false;
    memset(barcodeBuffer, 0, sizeof(barcodeBuffer));
  } else {
    Wire.write("EMPTY");  // 5 bytes
  }
}

// Xử lý khi nhận dữ liệu từ ESP8266
void receiveEvent(int numBytes) {
<<<<<<< HEAD
  char buffer[33] = { 0 };
=======
  char buffer[33] = {0};
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  int i = 0;

  while (Wire.available() && i < 32) {
    char c = Wire.read();
    if (isPrintable(c)) {
      buffer[i++] = c;
    }
  }
  buffer[i] = '\0';

  Serial.print("Received raw: ");
  Serial.println(buffer);

<<<<<<< HEAD
  parseIncomingMessage(buffer);  // Phân tích và cập nhật các cờ và loại thiết bị
  updateRGBLEDState();           // Cập nhật RGB
  handleIndicators();            // Chớp trắng/vàng nếu có
=======
  parseIncomingMessage(buffer); // Phân tích và cập nhật các cờ và loại thiết bị
  updateRGBLEDState();             // Cập nhật RGB
  handleIndicators();           // Chớp trắng/vàng nếu có
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
}

void parseIncomingMessage(const char* message) {
  // Reset các biến
  memset(device_type, 0, sizeof(device_type));
  successFlag = false;
  failureFlag = false;

  char msgCopy[33];
  strncpy(msgCopy, message, sizeof(msgCopy));
  msgCopy[sizeof(msgCopy) - 1] = '\0';

  char* token = strtok(msgCopy, ";");
  while (token != NULL) {
    if (strncmp(token, "TYPE:", 5) == 0) {
      strncpy(device_type, token + 5, sizeof(device_type) - 1);
    } else if (strncmp(token, "S:", 2) == 0) {
      successFlag = atoi(token + 2) == 1;
    } else if (strncmp(token, "F:", 2) == 0) {
      failureFlag = atoi(token + 2) == 1;
    }
    token = strtok(NULL, ";");
  }

<<<<<<< HEAD
  Serial.print("Parsed TYPE: ");
  Serial.println(device_type);
  Serial.print("Parsed S: ");
  Serial.println(successFlag);
  Serial.print("Parsed F: ");
  Serial.println(failureFlag);
}

void handleIndicators() {
  if ((!successFlag && !failureFlag && legFlag) || (successFlag == failureFlag && legFlag)) {
=======
  Serial.print("Parsed TYPE: "); Serial.println(device_type);
  Serial.print("Parsed S: "); Serial.println(successFlag);
  Serial.print("Parsed F: "); Serial.println(failureFlag);
}

void handleIndicators() {
  if ((!successFlag && !failureFlag) || successFlag == failureFlag){
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
    indicateSuccess();
    indicateFailure();
  }
  if (successFlag) {
    indicateSuccess();
  }
  if (failureFlag) {
    indicateFailure();
  }
}

// ------------------- HÀM XỬ LÝ RGB LED ----------------------
// Cập nhật trạng thái LED dựa trên device_type
void updateRGBLEDState() {
  if (strcmp(device_type, "import") == 0) {
<<<<<<< HEAD
    setRGBColor(255, 0, 0);  // RED
    legFlag = true;
  } else if (strcmp(device_type, "export") == 0) {
    setRGBColor(0, 255, 0);  // GREEN
    legFlag = true;
  } else if (strcmp(device_type, "check") == 0) {
    setRGBColor(0, 0, 255);  // BLUE
    legFlag = true;
=======
    setRGBColor(255, 0, 0); // RED
  } else if (strcmp(device_type, "export") == 0) {
    setRGBColor(0, 255, 0); // GREEN
  } else if (strcmp(device_type, "check") == 0) {
    setRGBColor(0, 0, 255); // BLUE
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  } else {
    setRGBColor(random(0, 256), random(0, 256), random(0, 256));  // Device chưa cấu hình, nhảy màu
    legFlag = false;
  }
}

// Điều khiển LED RGB
void setRGBColor(int red, int green, int blue) {
  analogWrite(RED_PIN, 255 - red);
  analogWrite(GREEN_PIN, 255 - green);
  analogWrite(BLUE_PIN, 255 - blue);
}

// ------------------- HÀM XỬ LÝ WHITE LED CHỈ BÁO ----------------------
void indicateSuccess() {
<<<<<<< HEAD
  isBlinkingWhite = true;
  blinkCountWhite = 0;
  previousMillisWhite = millis();
  blinkStateWhite = LOW;
=======
  digitalWrite(WHITE_LED_PIN, HIGH);
  delay(500);
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  digitalWrite(WHITE_LED_PIN, LOW);
}

void setupWhiteLED() {
  pinMode(WHITE_LED_PIN, OUTPUT);
  digitalWrite(WHITE_LED_PIN, LOW);
}

// ------------------- HÀM XỬ LÝ YELLOW LED CHỈ BÁO ----------------------
void indicateFailure() {
<<<<<<< HEAD
  isBlinkingYellow = true;
  blinkCountYellow = 0;
  previousMillisYellow = millis();
  blinkStateYellow = LOW;
=======
  digitalWrite(YELLOW_LED_PIN, HIGH);
  delay(500);
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  digitalWrite(YELLOW_LED_PIN, LOW);
}

void setupYellowLED() {
  pinMode(YELLOW_LED_PIN, OUTPUT);
  digitalWrite(YELLOW_LED_PIN, LOW);
}
<<<<<<< HEAD

void updateWhiteBlink() {
  if (isBlinkingWhite) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillisWhite >= 500) {
      previousMillisWhite = currentMillis;
      blinkStateWhite = !blinkStateWhite;
      digitalWrite(WHITE_LED_PIN, blinkStateWhite);

      if (blinkStateWhite == LOW) {
        blinkCountWhite++;
        if (blinkCountWhite >= 3) {
          isBlinkingWhite = false;
        }
      }
    }
  }
}

void updateYellowBlink() {
  if (isBlinkingYellow) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillisYellow >= 500) {
      previousMillisYellow = currentMillis;
      blinkStateYellow = !blinkStateYellow;
      digitalWrite(YELLOW_LED_PIN, blinkStateYellow);

      if (blinkStateYellow == LOW) {
        blinkCountYellow++;
        if (blinkCountYellow >= 3) {
          isBlinkingYellow = false;
        }
      }
    }
  }
}
=======
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
