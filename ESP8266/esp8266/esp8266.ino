#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "Huy Hoang";
const char* password = "25092003";
const char* serverUrl = "http://192.168.1.6:3000/api/receive_barcode_ESP";
const char* device_id = "check";

char receivedBarcode[33] = { 0 };  // 32 + null terminator
unsigned long lastRequestTime = 0;
const unsigned long REQUEST_INTERVAL = 500;

void setup() {
  Serial.begin(9600);
  Wire.begin(4, 5);  // SDA=D2(4), SCL=D1(5)

  connectWiFi();
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nFailed to connect! Retrying...");
    ESP.restart();
  }
}

void loop() {
  if (millis() - lastRequestTime >= REQUEST_INTERVAL) {
    requestBarcodeFromArduino();
    lastRequestTime = millis();
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  delay(500);
}

void requestBarcodeFromArduino() {
  memset(receivedBarcode, 0, sizeof(receivedBarcode));  // Xóa dữ liệu cũ

  Wire.requestFrom(8, 32);  // Request from Arduino (address 8)
  byte idx = 0;
  while (Wire.available() && idx < 32) {
    char c = Wire.read();
    if (isPrintable(c)) {  // Chỉ nhận ký tự có thể in
      receivedBarcode[idx++] = c;
    }
  }

  // Trim các ký tự không mong muốn
  trimBarcode(receivedBarcode);
  
  if (isValidBarcode(receivedBarcode)) { // Kiểm tra mã vạch hợp lệ
    Serial.print("Received barcode: ");
    Serial.println(receivedBarcode);
    sendToServer(receivedBarcode);
  } else {
    Serial.println("Invalid barcode received. Ignoring...");
  }
}

void trimBarcode(char* barcode) {
  int len = strlen(barcode);
  // Loại bỏ ký tự không mong muốn ở cuối
  while (len > 0 && (barcode[len - 1] == '\r' || barcode[len - 1] == '\n' || barcode[len - 1] == '\0')) {
    barcode[--len] = '\0';
  }
}

bool isValidBarcode(const char* barcode) {
  int len = strlen(barcode);
  if (len < 8 || len > 32) { // Kiểm tra độ dài hợp lệ
    return false;
  }
  // Kiểm tra nếu chứa chuỗi không mong muốn
  if (strcmp(barcode, "EMPTY") == 0) {
    return false;
  }
  return true;
}

void sendToServer(const char* barcode) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  // Tạo JSON payload
  String jsonPayload = "{\"barcode\":\"" + String(barcode) + "\",\"device_id\":\"" + device_id + "\"}";

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");

  Serial.println("Sending to server: " + jsonPayload);

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    Serial.printf("HTTP Code: %d\n", httpCode);
    String response = http.getString();
    Serial.println("Server response: " + response);
  } else {
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}