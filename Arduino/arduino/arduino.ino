#include <Wire.h> //I2C
#include <SoftwareSerial.h> //UART

#define GM65_RX 10
#define GM65_TX 11
#define MAX_BARCODE_LENGTH 30
#define I2C_BUFFER_SIZE 32

#define RED_PIN 5    // GPIO điều khiển LED đỏ
#define GREEN_PIN 6 // GPIO điều khiển LED xanh lá
#define BLUE_PIN 7  // GPIO điều khiển LED xanh dương

SoftwareSerial mySerial(GM65_RX, GM65_TX);  //Thiêt lập cổng UART
char barcodeBuffer[MAX_BARCODE_LENGTH + 1] = {0}; // Mảng lưu mã vạch
volatile bool newDataAvailable = false; // flag dữ liệu mới
unsigned long lastCharTime = 0;
const unsigned long BARCODE_TIMEOUT = 100; // 100ms timeout

char receivedDeviceId[33] = {0}; // Nhận chuỗi device_type (tối đa 32 ký tự)

void setup() {
  Serial.begin(9600);
  mySerial.begin(9600);
  
  Wire.begin(8); // Slave địa chỉ 8
  Wire.onRequest(requestEvent);
  Wire.onReceive(receiveEvent);
  
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  Serial.println("Arduino Ready - I2C Slave Address: 8");
}

void loop() {
  readBarcode();
  delay(50); // Tránh đọc quá nhanh
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
    } 
    else if (idx < MAX_BARCODE_LENGTH) {
      barcodeBuffer[idx++] = c;
    }
  }
  
  // Timeout reset
  if (idx > 0 && millis() - lastCharTime > BARCODE_TIMEOUT) {
    idx = 0;
    memset(barcodeBuffer, 0, sizeof(barcodeBuffer)); // xóa buffer
  }
}

void requestEvent() {
  if (newDataAvailable) {
    byte len = strlen(barcodeBuffer);
    if (len > I2C_BUFFER_SIZE - 1) len = I2C_BUFFER_SIZE - 1; // đảm bảo không vượt quá buffer
    
    Wire.write(barcodeBuffer, len); // gửi I2C
    Serial.print("Sent to ESP: ");
    Serial.println(barcodeBuffer);
    
    newDataAvailable = false;
    memset(barcodeBuffer, 0, sizeof(barcodeBuffer));
  } else {
    Wire.write("EMPTY"); // 5 bytes
  }
}

// Xử lý khi nhận dữ liệu từ ESP8266
void receiveEvent(int numBytes) {
  memset(receivedDeviceId, 0, sizeof(receivedDeviceId)); // Xóa dữ liệu cũ
  int i = 0;

  while (Wire.available() && i < 32) {
    char c = Wire.read();
    if (isPrintable(c)) {
      receivedDeviceId[i++] = c;
    }
  }
  receivedDeviceId[i] = '\0'; // Thêm null terminator

  Serial.print("Received device ID: ");
  Serial.println(receivedDeviceId);
  updateLEDState();
}

// Cập nhật trạng thái LED dựa trên device_type
void updateLEDState() {
  if (strcmp(receivedDeviceId, "import") == 0) {
    setRGBColor(255, 0, 0); // RED
  } else if (strcmp(receivedDeviceId, "export") == 0) {
    setRGBColor(0, 255, 0); // GREEN
  } else if (strcmp(receivedDeviceId, "check") == 0) {
    setRGBColor(0, 0, 255); // BLUE
  } else {
    setRGBColor(random(0, 256), random(0, 256), random(0, 256)); // Device chưa cấu hình, nhảy màu
  }
}

// Điều khiển LED RGB
void setRGBColor(int red, int green, int blue) {
  analogWrite(RED_PIN, 255 - red);
  analogWrite(GREEN_PIN, 255 - green);
  analogWrite(BLUE_PIN, 255 - blue);
}
