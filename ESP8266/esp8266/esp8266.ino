#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include <Hash.h>
// #include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>  // tạm thời để dev

#define EEPROM_SIZE 512
#define SECRET_KEY "WarehouseManagermentIoT"
#define AUTH_TOKEN "TokenIoTVMU"

// Chân nút reset
#define RESET_BUTTON_PIN 0 //D3 = GPIO0
// Chân White LED chỉ báo
#define WHITE_LED_PIN 2 //D4 = GPIO2
// Chân Yellow LED chỉ báo
#define YELLOW_LED_PIN 4 //D5 = GPIO14

// Cổng ESP Config
ESP8266WebServer server(80);

//Biến nhận mã vạch
char receivedBarcode[33] = { 0 };  // 32 + null terminator
unsigned long lastRequestTime = 0;
const unsigned long REQUEST_INTERVAL = 500;


// Biến lưu cấu hình
String ssid = "";
String password = "";
String serverUrl = "http://192.168.1.6:3000/api/receive_barcode_ESP";
String device_id = "DEV001";
String device_type = "";

// Biến xử lý nút reset
volatile bool isResetPressed = false;
unsigned long resetPressedTime = 0;

void ICACHE_RAM_ATTR handleResetButton(); // Khai báo hàm ISR

void setup() {
  // setup cổng giao tiếp
  Serial.begin(9600);
  Wire.begin(4, 5);  // SDA=D2(4), SCL=D1(5)

  // setup EEPROM & ESP Config
  EEPROM.begin(EEPROM_SIZE);
  loadConfigFromEEPROM();  // Đọc cấu hình WiFi & device_type từ EEPROM

  // setup RESET BUTTON
  pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RESET_BUTTON_PIN), handleResetButton, CHANGE);

  // setup WHITE LED
  setupWhiteLED();

  // setup YELOOW LED
  setupYellowLED();

  if (!connectWiFi()) {
    setupAPMode();  //chế độ Access Point
  }

  startWebServer();  // Khởi tạo WebServer cấu hình
}
// -----------------------------------------------------
void loop() {
  // Giới hạn tần suất lấy barcode để tránh gửi liên tục
  if (millis() - lastRequestTime >= REQUEST_INTERVAL) {
    requestBarcodeFromArduino();
    sendDeviceTypeToArduino();
    lastRequestTime = millis();
  }

  checkResetButton();  // kiểm tra trạng thái nút

  server.handleClient();  // Xử lý yêu cầu HTTP (nếu đang ở chế độ cấu hình)
  delay(500);
}
// ------------------- Kết nối WiFi với SSID và Password đã lưu ----------------------
bool connectWiFi() {
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("Connecting to WiFi");

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
    return true;
  }

  Serial.println("\nFailed to connect.");
  return false;
}
// ------------------- Thiết lập chế độ Access Point để cấu hình WiFi-----------------------------
void setupAPMode() {
  WiFi.softAP("ESP8266_Config");
  IPAddress ip = WiFi.softAPIP();
  Serial.println("---------------AP Mode - Connect to ESP8266_Config---------------");
  Serial.print("IP: ");
  Serial.println(ip);
}
// ------------------- Yêu cầu dữ liệu mã vạch từ Arduino qua I2C ----------------------
void requestBarcodeFromArduino() {
  memset(receivedBarcode, 0, sizeof(receivedBarcode));  // Xóa dữ liệu cũ

  Wire.requestFrom(8, 32);  // Yêu cầu 32 byte từ Arduino (I2C addr = 8)
  byte idx = 0;
  while (Wire.available() && idx < 32) {
    char c = Wire.read();
    if (isPrintable(c)) {  // Chỉ nhận ký tự có thể in
      receivedBarcode[idx++] = c;
    }
  }

  // Trim các ký tự không mong muốn
  trimBarcode(receivedBarcode);

  if (isValidBarcode(receivedBarcode)) {  // Kiểm tra mã vạch hợp lệ
    Serial.print("Received barcode: ");
    Serial.println(receivedBarcode);
    sendToServer(receivedBarcode);
  } else {
    indicateFailure();  // chỉ báo thất bại
    Serial.println("Invalid barcode received. Ignoring...");
  }
}
// ------------------- HÀM FORMAT BARCODE NHẬN ĐƯỢC ----------------------

//Xử lý loại bỏ ký tự không mong muốn ở cuối chuỗi
void trimBarcode(char* barcode) {
  int len = strlen(barcode);
  // Loại bỏ ký tự không mong muốn ở cuối
  while (len > 0 && (barcode[len - 1] == '\r' || barcode[len - 1] == '\n' || barcode[len - 1] == '\0')) {
    barcode[--len] = '\0';
  }
}
//Kiểm tra tính hợp lệ của mã vạcH
bool isValidBarcode(const char* barcode) {
  int len = strlen(barcode);
  if (len < 8 || len > 32) {  // Kiểm tra độ dài hợp lệ
    return false;
  }
  // Kiểm tra nếu chứa chuỗi không mong muốn
  if (strcmp(barcode, "EMPTY") == 0) {
    return false;
  }
  return true;
}
// ------------------- Tạo chữ ký SHA1 từ barcode + device_id + device_type + secret key ----------------------
String createSignature(const String& barcode, const String& device_type) {
  String raw = barcode + device_id + device_type + SECRET_KEY;
  return sha1(raw);  // Tạo SHA1 hash
}
// ------------------- Gửi mã vạch lên server REST API qua HTTP POST ----------------
void sendToServer(const char* barcode) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return;
  }

  // tạm thời comment để dev
  // WiFiClientSecure client;
  // client.setInsecure(); // Bỏ qua xác minh chứng chỉ SSL

  WiFiClient client;
  HTTPClient http;

  String barcodeStr = String(barcode);
  String signature = createSignature(barcodeStr, device_type);

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " AUTH_TOKEN);
  http.addHeader("X-Signature", signature);

  String jsonPayload = "{\"barcode\":\"" + barcodeStr + "\",\"device_id\":\"" + device_id + "\",\"device_type\":\"" + device_type + "\"}";
  Serial.println("Sending to server: " + jsonPayload);

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    Serial.printf("HTTP Code: %d\n", httpCode);
    String response = http.getString();
    Serial.println("Server response: " + response);
    // Hiện đèn báo thành công
    if (httpCode == 200) {
      indicateSuccess();
    }

  } else {
    Serial.printf("HTTP Code: %d\n", httpCode);
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }
  // Hiện đèn báo thất bại
  if (httpCode != 200) {
    indicateFailure();
  }
  http.end();
}
// ------------------- HÀM EEPROM ----------------------
// 0–31: SSID
// 32–63: PASSWORD
// 64–143: serverUrl
// 144–175: device_type

//EEPROM: Ghi chuỗi vào EEPROM (dài tối đa maxLength)
void writeStringToEEPROM(int addr, const String& data, int maxLength) {
  for (int i = 0; i < maxLength; i++) {
    EEPROM.write(addr + i, i < data.length() ? data[i] : 0);
  }
}
//EEPROM: Đọc chuỗi từ EEPROM
String readStringFromEEPROM(int addr, int maxLength) {
  char data[maxLength + 1];
  for (int i = 0; i < maxLength; i++) {
    data[i] = EEPROM.read(addr + i);
  }
  data[maxLength] = '\0';
  return String(data);
}

//Ghi cấu hình WiFi + device_type vào EEPROM
void saveConfigToEEPROM() {
  writeStringToEEPROM(0, ssid, 32);
  writeStringToEEPROM(32, password, 32);
  writeStringToEEPROM(64, serverUrl, 80);
  writeStringToEEPROM(144, device_type, 32);
  EEPROM.commit();
}
// Đọc cấu hình từ EEPROM sau khi khởi động
void loadConfigFromEEPROM() {
  ssid = readStringFromEEPROM(0, 32);
  password = readStringFromEEPROM(32, 32);
  serverUrl = readStringFromEEPROM(64, 80);
  device_type = readStringFromEEPROM(144, 32);
}

// --------- GIAO DIỆN FORM CẤU HÌNH -------------------
void handleRoot() {
  int n = WiFi.scanNetworks();
  String html = "<html><body><h2>ESP8266 Config</h2>"
                "<form action='/save' method='POST'>";

  html += "SSID: <select name='ssid'>";
  for (int i = 0; i < n; ++i) {
    String ssidOption = WiFi.SSID(i);
    html += "<option value='" + ssidOption + "'";
    if (ssidOption == ssid) html += " selected";
    html += ">" + ssidOption + "</option>";
  }
  html += "</select><br>";

  html += "Password: <input type='password' name='password' value='" + password + "'><br>"
                                                                                  "Device ID: <select name='device'>"
                                                                                  "<option value='check' "
          + (device_type == "check" ? "selected" : "") + ">Kiểm hàng</option>"
                                                       "<option value='import' "
          + (device_type == "import" ? "selected" : "") + ">Nhập hàng</option>"
                                                        "<option value='export' "
          + (device_type == "export" ? "selected" : "") + ">Xuất hàng</option>"
                                                        "</select><br>"
                                                        "<input type='submit' value='Save & Reboot'>"
                                                        "</form></body></html>";

  server.send(200, "text/html", html);
}

//Xử lý lưu thông tin sau khi người dùng gửi form cấu hình
void handleSave() {
  ssid = server.arg("ssid");
  password = server.arg("password");
  // serverUrl = server.arg("server");
  device_type = server.arg("device");

  saveConfigToEEPROM();

  server.send(200, "text/html", "<html><body><h2>Saved! Rebooting...</h2></body></html>");
  delay(3000);
  ESP.restart();
}

// Khởi tạo WebServer để cấu hình qua trình duyệt
void startWebServer() {
  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  Serial.println("---------------Web server started---------------");
}

// ------------------- HÀM XỬ LÝ BUTTON ----------------------
void ICACHE_RAM_ATTR handleResetButton() {
  if (digitalRead(RESET_BUTTON_PIN) == LOW) {  // Nút được nhấn
    resetPressedTime = millis();
  } else {  // Nút được thả
    if (millis() - resetPressedTime >= 3000) {
      isResetPressed = true;
    }
  }
}

void checkResetButton() {
  if (isResetPressed) {
    isResetPressed = false;
    setupAPMode();  // Chuyển sang chế độ Access Point
  }
}

// ------------------- HÀM XỬ LÝ RGB LED ----------------------
// Gửi device_type tới Arduino qua I2C
void sendDeviceTypeToArduino() {
  Wire.beginTransmission(8); // I2C address of Arduino
  Wire.write(device_type.c_str()); // Gửi chuỗi device_type
  Wire.endTransmission();
  Serial.println("Device ID sent to Arduino: " + device_type);
}

// ------------------- HÀM XỬ LÝ WHITE LED CHỈ BÁO ----------------------
void indicateSuccess() {
  digitalWrite(WHITE_LED_PIN, HIGH);
  delay(500);
  digitalWrite(WHITE_LED_PIN, LOW);
}

void setupWhiteLED() {
  pinMode(WHITE_LED_PIN, OUTPUT);
  digitalWrite(WHITE_LED_PIN, LOW);
}

// ------------------- HÀM XỬ LÝ YELLOW LED CHỈ BÁO ----------------------
void indicateFailure() {
  digitalWrite(YELLOW_LED_PIN, HIGH);
  delay(500);
  digitalWrite(YELLOW_LED_PIN, LOW);
}

void setupYellowLED() {
  pinMode(YELLOW_LED_PIN, OUTPUT);
  digitalWrite(YELLOW_LED_PIN, LOW);
}