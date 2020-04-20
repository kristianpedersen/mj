#include <SoftwareSerial.h>
#include "TFMini.h"

SoftwareSerial mySerial(10, 11);
TFMini tfmini;

void setup() {
  Serial.begin(115200);
  while (!Serial);
  mySerial.begin(TFMINI_BAUDRATE);
  tfmini.begin(&mySerial);

  Serial.println("TF Mini Measurements");
}

void loop() {
  uint16_t dist = tfmini.getDistance();
  Serial.println(dist);
  delay(25);
}
