
/*if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(function(reg){
            log('SW registration succeeded. Scope is ' + reg.scope);
        }).catch(function(err){
            log('SW registration failed with error '+err);
        });
}*/
function isWebBluetoothEnabled() {
    if (navigator.bluetooth) {
      return true;
    } else {
      ChromeSamples.setStatus('Web Bluetooth API is not available.\n' +
          'Please make sure the "Experimental Web Platform features" flag is enabled.');
      return false;
    }
  }

  var ChromeSamples = {
    log: function() {
      var line = Array.prototype.slice.call(arguments).map(function(argument) {
        return typeof argument === 'string' ? argument : JSON.stringify(argument);
      }).join(' ');

      document.querySelector('#log').textContent += line + '\n';
    },

    clearLog: function() {
      document.querySelector('#log').textContent = '';
    },

    setStatus: function(status) {
      document.querySelector('#status').textContent = status;
    },
  };
 if (/Chrome\/(\d+\.\d+.\d+.\d+)/.test(navigator.userAgent)){
    // Let's log a warning if the sample is not supposed to execute on this
    // version of Chrome.
    if (50 > parseInt(RegExp.$1)) {
      ChromeSamples.setStatus('Warning! Keep in mind this sample has been tested with Chrome ' + 50 + '.');
    }
  }

function onButtonClick() {
  console.log("about to request device");
  navigator.bluetooth.requestDevice({
	 // log('bluetooth.requestDevice...');
   // filters: [...] <- Prefer filters to save energy & show relevant devices.
      acceptAllDevices: true,
      //optionalServices: ['device_information']})
	  optionalServices: [0xFDD2]})
  .then(device => {
    console.log('Got BT Device...');
    return device.gatt.connect();
  }/*, error => {console.log 'error in requestDevice'};*/)
  .then(server => {
	  console.log('Got BT GATT server...');
	return server.getPrimaryService(0x7fed8d43a6a0);
  }, error => {console.log('error in GATT connect...');})
   .then(service => {
    console.log('Getting BT GATT service ...');
    return service.getCharacteristics();
}, error => {console.log('error in getPrimaryService...', error);} )

  .then(characteristics => {
	  console.log('getting characteristics...');
    //let queue = Promise.resolve();
    //let decoder = new TextDecoder('utf-8');
    characteristics.forEach(characteristic => {
		console.log('characteristic.uuid:' + characteristic.uuid);
      switch (characteristic.uuid)
      {
        //5af38af6-000e-404b-9b46-07f77580890b -- characteristic for Sensor configuration
		case '5af38af6-000e-404b-9b46-07f77580890b':
                console.log('read sensor conf');
				characteristic.readValue()
                .then(dataView => {
                    var value = dataView;
					console.log('Value is :' + value);
                    /*log('sensor id :' + value.getUint8(0) );
                    log('sensor sample period :' + value.getUint16(1));
                    log('sensor id :' + value.getUint8(3));
                    log('sensor sample period :' + value.getUint16(4));
                    log('sensor id :' + value.getUint8(6));
                    log('sensor sample period :' + value.getUint16(7));
                    log('sensor id :' + value.getUint8(9));
                    log('sensor sample period :' + value.getUint16(10));
                    if( value.getUint8(9) === 3 && value.getUint16(10) == 0)
                    {
                        log('sensor id is:' + value.getUint8(9) + '(Game Rotation Vector), sample period is:' +  value.getUint16(10));
                    }*/

                    //create buffer to write GATT characteristics
                    var buffer = new ArrayBuffer(3);
                    var value1 = new DataView(buffer);
                    value1.setUint8(0,3); //sensor id =3 as 'Game rotation vector'
                    value1.setUint16(1,40); //rate as 40
                    characteristic.writeValue(value1);
                }, error => {console.log ('error in readValue:' + error);});
                break;
         case '56a72ab8-4988-4cc8-a752-fbd1d54a953d':
               characteristic.startNotifications()
               .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged',
                                  handleCharacteristicValueChanged);
                }, error => {console.log('error in startNotifications:' + error);});
                break;
        }

      });
      //return queue;
  }, error => {console.log('error in getCharacteristics...');} )
.catch(error => {console.log('Argh! ' + error);})
}

/* Utils */

function padHex(value) {
  return ('00' + value.toString(16).toUpperCase()).slice(-2);
}

function getUsbVendorName(value) {
  // Check out page source to see what valueToUsbVendorName object is.
  return value +
      (value in valueToUsbVendorName ? ' (' + valueToUsbVendorName[value] + ')' : '');
}

function handleCharacteristicValueChanged(event) {
  var value = event.target.value;
    //ChromeSamples.clearLog();
    var i = 0;
    var foundGameRotate = false;

    while (foundGameRotate == false)
    {
        var sensorId = value.getUint8(i);
        if (sensorId == 3)
        {
            var x = value.getInt16(i+3)/16384;
            x = parseFloat(x).toFixed(3);

            var y = value.getInt16(i+5)/16384;
            y = parseFloat(y).toFixed(3);

            var z = value.getInt16(i+7)/16384;
            z = parseFloat(z).toFixed(3);

            var w = value.getInt16(i+9)/16384;
            w = parseFloat(w).toFixed(3);

            /*log('> Sample Data (x)' + x);
            log('> Sample Data (y)' + y);
            log('> Sample Data (z)' + z);
            log('> Sample Data (W)' + w);*/

            //Pitch
            var sinp = 2 * (w * x + y * z);
            var cosp = 1 - 2 * (x * x + y * y);
            var pitch = Math.atan2(sinp,cosp) + Math.PI;
            pitch = pitch > Math.PI ? pitch - 2 * Math.PI : pitch;
            var pitchd = (pitch * (180/Math.PI)).toFixed(2);

            //roll
            var sinr = 2 * (w * y - z * x);
            if (Math.abs(sinr) >= 1)
            {
                if (Math.sign(sinr) == 1)
                {
                    roll = -(Math.PI/2);
                }
                else
                {
                    roll = Math.PI/2;
                }
            }
            else
            {
               roll = -(Math.asin(sinr));
            }
            var rolld = (roll * (180/Math.PI)).toFixed(2);

            //Yaw
            var siny = 2 * (w * z + x * y);
            var cosy = 1 - 2 * (y * y + z * z);
            yaw = -(Math.atan2(siny,cosy));
            var yawd = (yaw * (180/Math.PI)).toFixed(2);

            console.log('> Sample Data (yaw in Degree)' + yawd);
            console.log('> Sample Data (pitch in Degree)' + pitchd);
            console.log('> Sample Data (roll in Degree)' + rolld);
            /*//log('> Sample Data (Yaw)' + yaw);
            //log('> Sample Data (pitch in radian)' + pitch);
            //log('> Sample Data (roll)' + roll);*/
            foundGameRotate = true;
            decoderRotationY = yawd;
            decoderRotationP = pitchd;
            decoderRotationR = rolld;
        }
        else if (sensorId == 0 )
        {
             //log('Sensor id:' + sensorId + ' Accelerometer');
             i = i+10;
        }
        else if (sensorId == 1 )
        {
            //log('Sensor id:' + sensorId + ' Gyroscope');
            i = i+10;
        }
        else if (sensorId == 2 )
        {
            //log('Sensor id:' + sensorId + ' Geomagnectic');
            i = i+13;
        }
        else
        {
           //log('Sensor id not matched');
        }
    }
}


  log = ChromeSamples.log;

      // Add a global error event listener early on in the page load, to help ensure that browsers
      // which don't support specific functionality still end up displaying a meaningful message.
      window.addEventListener('error', function(error) {
        if (ChromeSamples && ChromeSamples.setStatus) {
          console.error(error);
          ChromeSamples.setStatus(error.message + ' (Your browser may not support this feature.)');
          error.preventDefault();
        }
      });
