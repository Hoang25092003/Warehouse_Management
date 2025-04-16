#include <Wire.h> //I2C
#include <SoftwareSerial.h> //UART

#define GM65_RX 10
#define GM65_TX 11
#define MAX_BARCODE_LENGTH 30
#define I2C_BUFFER_SIZE 32

SoftwareSerial mySerial(GM65_RX, GM65_TX);  //Thiêt lập cổng UART
char barcodeBuffer[MAX_BARCODE_LENGTH + 1] = {0}; // Mảng lưu mã vạch
volatile bool newDataAvailable = false; // flag dữ liệu mới
unsigned long lastCharTime = 0;
const unsigned long BARCODE_TIMEOUT = 100; // 100ms timeout

void setup() {
  Serial.begin(9600);
  mySerial.begin(9600);
  
  Wire.begin(8); // Slave địa chỉ 8
  Wire.onRequest(requestEvent);
  
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