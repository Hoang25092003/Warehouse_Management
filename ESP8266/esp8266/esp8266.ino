#include <Wire.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <EEPROM.h>
#include <Hash.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>

#define EEPROM_SIZE 512
#define SECRET_KEY "WarehouseManagermentIoT"
#define AUTH_TOKEN "TokenIoTVMU"

// Chân nút reset
#define RESET_BUTTON_PIN 0  //D3 = GPIO0

// Cổng ESP Config
ESP8266WebServer server(80);

//Biến nhận mã vạch
char receivedBarcode[33] = { 0 };  // 32 + null terminator
unsigned long lastRequestTime = 0;
const unsigned long REQUEST_INTERVAL = 500;


// Biến lưu cấu hình
<<<<<<< HEAD
// const String serverBase = "http://192.168.1.5:3000";
=======
// const String serverBase = "http://192.168.1.71:3000";
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
const String serverBase = "https://warehouse-management-r8on.onrender.com";
const String serverUrl = serverBase + "/api/receive_barcode_ESP";
const String device_id = "DEV001";

String ssid = "";
String password = "";
String device_type = "";

// Biến xử lý nút reset
volatile bool resetInProgress = false;
volatile bool isResetPressed = false;
volatile unsigned long resetPressedTime = 0;

// Biến xử lý đèn chỉ báo
bool indicateSuccess = false;
bool indicateFailure = false;

void ICACHE_RAM_ATTR handleResetButton();  // Khai báo hàm ISR

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

  if (resetInProgress && (millis() - resetPressedTime >= 3000)) {
    isResetPressed = true;
    resetInProgress = false;  // Đảm bảo chỉ kích hoạt một lần
  }
<<<<<<< HEAD
  checkResetButton();  // kiểm tra trạng thái nút
=======
    checkResetButton();  // kiểm tra trạng thái nút
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33

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
  // Xóa EEPROM
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0xFF);  // Xóa từng ô nhớ
  }
  EEPROM.commit();  // Ghi thay đổi vào flash
<<<<<<< HEAD
  ssid = "";
  password = "";
  device_type = "";
=======
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  Serial.println("EEPROM has been erased.");

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

  WiFiClientSecure client;
  client.setInsecure();  // Bỏ qua xác minh chứng chỉ SSL

  // WiFiClient client;
  HTTPClient http;
  http.setTimeout(10000);

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
      indicateSuccess = true;
      indicateFailure = false;
    }
  } else {
    Serial.printf("HTTP Code: %d\n", httpCode);
    Serial.printf("HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }
  // Hiện đèn báo thất bại
  if (httpCode != 200) {
    indicateSuccess = false;
    indicateFailure = true;
  }
  http.end();
}
// ------------------- HÀM EEPROM ----------------------
// 0–31: SSID
// 32–63: PASSWORD
// 64–143: device_type

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
  writeStringToEEPROM(64, device_type, 32);
  EEPROM.commit();
}
// Đọc cấu hình từ EEPROM sau khi khởi động
void loadConfigFromEEPROM() {
  ssid = readStringFromEEPROM(0, 32);
  password = readStringFromEEPROM(32, 32);
  device_type = readStringFromEEPROM(64, 32);
}

void handleRoot() {
  int n = WiFi.scanNetworks();
<<<<<<< HEAD
  String html = "<!DOCTYPE html><html><head>";
  html += "<meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<style>";
  html += "body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; }";
  html += "form { max-width: 400px; margin: auto; background: white; padding: 20px; border-radius: 10px; "
          "box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }";
  html += "h2 { text-align: center; }";
  html += "label { display: block; margin-top: 15px; font-weight: bold; }";
  html += "input, select { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 5px; }";
  html += ".password-wrapper { position: relative; }";
  html += ".toggle-password { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); cursor: pointer; font-size: 16px; }";
  html += "button { width: 100%; padding: 10px; background-color: #28a745; color: white; font-weight: bold; "
          "border: none; border-radius: 5px; margin-top: 20px; cursor: not-allowed; opacity: 0.6; }";
  html += "button.enabled { cursor: pointer; opacity: 1; }";
  html += "#loading { display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }";
  html += ".spinner { border: 5px solid #f3f3f3; border-top: 5px solid #28a745; border-radius: 50%; "
          "width: 40px; height: 40px; animation: spin 1s linear infinite; margin: auto; }";
  html += "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
  html += "</style>";
  html += "<script>";
  html += "function validatePassword() {";
  html += "  const pass = document.getElementById('pass');";
  html += "  const btn = document.getElementById('submit');";
  html += "  if (pass.value.length >= 8) {";
  html += "    btn.classList.add('enabled'); btn.disabled = false;";
  html += "  } else {";
  html += "    btn.classList.remove('enabled'); btn.disabled = true;";
  html += "  }";
  html += "}";
  html += "function showSpinner() {";
  html += "  document.getElementById('form-content').style.opacity = '0.3';";
  html += "  document.getElementById('loading').style.display = 'block';";
  html += "}";
  html += "function togglePassword() {";
  html += "  var pass = document.getElementById('pass');";
  html += "  var icon = document.getElementById('eye');";
  html += "  if (pass.type === 'password') { pass.type = 'text'; icon.textContent = '🙈'; }";
  html += "  else { pass.type = 'password'; icon.textContent = '👁️'; }";
  html += "}";
  html += "</script>";
  html += "</head><body>";
  html += "<h2>Cấu hình WiFi</h2>";
  html += "<form action='/save' method='POST' onsubmit='showSpinner()'>";
  html += "<div id='form-content'>";

  // SSID
  html += "<label for='ssid'>WiFi SSID:</label>";
  html += "<select name='ssid'>";
=======
  String html = "<html><head><meta charset='UTF-8'></head><body>";
  html += "<h2>ESP8266 Config</h2><form action='/save' method='POST'>";
  html += "SSID: <select name='ssid'>";
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  for (int i = 0; i < n; ++i) {
    String s = WiFi.SSID(i);
    html += "<option value='" + s + "'";
    if (s == ssid) html += " selected";
    html += ">" + s + "</option>";
  }
  html += "</select>";

<<<<<<< HEAD
  //Device ID
  html += "<label>Mã thiết bị:</label><input type='text' value='" + device_id + "' readonly>";

  // Password
  html += "<label for='password'>Mật khẩu WiFi:</label>";
  html += "<div class='password-wrapper'>";
  html += "<input type='password' id='pass' name='password' value='" + password + "' oninput='validatePassword()'>";
  html += "<span class='toggle-password' id='eye' onclick='togglePassword()'>👁️</span>";
  html += "</div>";

  // Device type
  html += "<label for='device_type'>Loại thiết bị:</label>";
  html += "<select name='device_type'>";
  html += "<option value='import'" + String(device_type == "import" ? " selected" : "") + ">Nhập hàng 🔴</option>";
  html += "<option value='export'" + String(device_type == "export" ? " selected" : "") + ">Xuất hàng 🟢</option>";
  html += "<option value='check'" + String(device_type == "check" ? " selected" : "") + ">Kiểm hàng 🔵</option>";
  html += "</select>";

  // Submit
  html += "<button id='submit' type='submit' disabled>Thiết lập cấu hình</button>";
  html += "</div>";

  // Spinner
  html += "<div id='loading'><div class='spinner'></div></div>";

  html += "</form></body></html>";

=======
  html += "Password: <input type='password' name='password' value='" + password + "'><br>";
  html += "Device Type: <select name='device_type'>";
  html += "<option value='check'" + String(device_type == "check" ? " selected" : "") + ">Kiểm hàng</option>";
  html += "<option value='import'" + String(device_type == "import" ? " selected" : "") + ">Nhập hàng</option>";
  html += "<option value='export'" + String(device_type == "export" ? " selected" : "") + ">Xuất hàng</option>";
  html += "</select><br><input type='submit' value='Save & Reboot'></form></body></html>";

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  server.send(200, "text/html; charset=UTF-8", html);
}



//Xử lý lưu thông tin sau khi người dùng gửi form cấu hình
void handleSave() {
  ssid = server.arg("ssid");
  password = server.arg("password");
  device_type = server.arg("device_type");

  saveConfigToEEPROM();
  delay(200);
  bool checkConnectToWifi = connectWiFi();
  delay(200);
  if (checkConnectToWifi) {
    server.send(200, "text/html",
                "<!DOCTYPE html><html><head>"
                "<meta charset='UTF-8'>"
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                "<meta http-equiv='refresh' content='5'>"
                "<style>"
                "body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }"
                ".container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px; "
                "box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; }"
                "h2 { color: #28a745; }"
                "p { font-size: 16px; color: #333; }"
                "</style></head><body>"
                "<div class='container'>"
                "<h2>✅ Cấu hình đã được lưu!</h2>"
                "<p>Thiết bị sẽ khởi động lại để kết nối WiFi mới.</p>"
                "<p>Nếu không kết nối được, thiết bị sẽ tự động quay về chế độ cấu hình.</p>"
                "</div></body></html>");

    delay(1000);
    ESP.restart();
  } else {
    setupAPMode();
    server.send(200, "text/html",
                "<!DOCTYPE html><html><head>"
                "<meta charset='UTF-8'>"
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                "<meta http-equiv='refresh' content='5; URL=/' />"
                "<style>"
                "body { font-family: Arial, sans-serif; background-color: #fff0f0; padding: 20px; }"
                ".container { max-width: 500px; margin: auto; background: white; padding: 20px; border-radius: 10px; "
                "box-shadow: 0 0 10px rgba(255,0,0,0.1); text-align: center; }"
                "h2 { color: #dc3545; }"
                "p { font-size: 16px; color: #333; }"
                "</style></head><body>"
                "<div class='container'>"
                "<h2>❌ Kết nối WiFi thất bại!</h2>"
                "<p>Vui lòng kiểm tra lại SSID và Mật khẩu.</p>"
                "<p>Đang quay lại trang cấu hình...</p>"
                "</div></body></html>");
  }
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
    resetInProgress = true;
  } else {  // Nút được thả
    resetInProgress = false;
  }
}

void checkResetButton() {
  if (isResetPressed) {
    isResetPressed = false;

    indicateSuccess = false;
    indicateFailure = false;
    Serial.println("-------------------Reset ESP8266!---------------------");
    setupAPMode();  // Chuyển sang chế độ Access Point
  }
}

// ------------------- HÀM XỬ LÝ RGB LED ----------------------
// Gửi device_type tới Arduino qua I2C
void sendDeviceTypeToArduino() {
  // Tạo buffer gửi, tối đa 32 byte (I2C limit)
  char buffer[32] = { 0 };

  // Format: "TYPE:check;S:1;F:0"
  snprintf(buffer, sizeof(buffer), "TYPE:%s;S:%d;F:%d",
           device_type.c_str(),
           indicateSuccess ? 1 : 0,
           indicateFailure ? 1 : 0);

  Wire.beginTransmission(8);  // Arduino có địa chỉ I2C là 8
  Wire.write(buffer);         // Gửi cả chuỗi
  Wire.endTransmission();

  Serial.print("Sent to Arduino: ");
  Serial.println(buffer);
}
