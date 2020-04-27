#include <SoftwareSerial.h>
#include <TFMini.h>

SoftwareSerial mySerial(10, 11);
TFMini tfmini;

void setup() {
  Serial.begin(115200);
  while (!Serial);
  mySerial.begin(TFMINI_BAUDRATE);
  tfmini.begin(&mySerial);
}

void loop() { 
  Serial.println(tfmini.getDistance(););
  delay(25);
}
