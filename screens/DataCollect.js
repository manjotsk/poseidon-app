import * as WebBrowser from "expo-web-browser";
import * as MediaLibrary from "expo-media-library";
import React, { Component } from "react";
import * as Permissions from "expo-permissions";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Share
} from "react-native";
import { Gyroscope, Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import { Block, Text, Button, theme } from "galio-framework";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Axios from "axios";

export default class HomeScreen extends Component {
  state = {
    sensorData: [],
    longitude: "",
    lattitude: "",
    pothole: false
  };
  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied"
      });
    }

    this.interval2 = setInterval(async () => {
      let location = await Location.getCurrentPositionAsync({});
      console.log(JSON.stringify(location));

      this.setState({
        longitude: location.coords.longitude,
        lattitude: location.coords.latitude
      });
    }, 1000);
  };
  componentDidMount() {
    this._getLocationAsync();
    Permissions.askAsync(Permissions.CAMERA_ROLL);
    FileSystem.getInfoAsync(FileSystem.documentDirectory + "data.csv")
      .then(async resp => {
        console.log("************************* Writing");
        MediaLibrary.createAssetAsync(`${FileSystem.documentDirectory}data.csv`)
          .then(resp => {
            console.log("32");
          })
          .catch(err => {
            console.log("35");
          });
        FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + "data.csv",
          "",
          {
            encoding: FileSystem.EncodingType.UTF8
          }
        ).then(resp => {
          // alert("ok");
        });
      })
      .catch(err => {
        FileSystem.makeDirectoryAsync(FileSystem.documentDirectory)
          .then(resp => {
            FileSystem.writeAsStringAsync(
              FileSystem.documentDirectory + "data.csv",
              "",
              {
                encoding: FileSystem.EncodingType.UTF8
              }
            )
              .then(resp => {
                console.log("56");
              })
              .catch(err => {
                console.log("59");
              });
          })
          .catch(err => {
            console.log("57");
          });
        console.log("*************************", err);
      });
    // this._toggle();
  }
  onPotholeDetect() {
    this.props.navigation.navigate("Articles");
  }
  componentWillUnmount() {
    this._unsubscribe();
  }

  _toggle = () => {
    if (this._subscription || this._subscription1) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  };

  _slow = () => {
    Gyroscope.setUpdateInterval(1000);
    Accelerometer.setUpdateInterval(1000);
  };

  _fast = () => {
    Gyroscope.setUpdateInterval(16);
    Accelerometer.setUpdateInterval(16);
  };

  _subscribe = () => {
    let gyroscopeData = { gx: 0, gy: 0, gz: 0 };
    let accelerometerData = { ax: 0, ay: 0, az: 0 };
    this._subscription = Gyroscope.addListener(result => {
      gyroscopeData = { gx: result.x, gy: result.y, gz: result.z };
    });
    this._subscription1 = Accelerometer.addListener(result => {
      accelerometerData = { ax: result.x, ay: result.y, az: result.z };
      console.log(accelerometerData);
    });
    this.interval = setInterval(() => {
      this.setState(
        () => {
          return {
            sensorData: [
              {
                accelerometerData,
                gyroscopeData,
                timestamp: new Date().valueOf()
              }
            ]
          };
        },
        () => {
          let datastring = `${this.state.sensorData[0].timestamp},${
            this.state.sensorData[0].gyroscopeData.gx
          },${this.state.sensorData[0].gyroscopeData.gy},${
            this.state.sensorData[0].gyroscopeData.gz
          },${this.state.sensorData[0].accelerometerData.ax},${
            this.state.sensorData[0].accelerometerData.ay
          },${this.state.sensorData[0].accelerometerData.az},${
            this.state.longitude
          },${this.state.lattitude},${this.state.pothole ? 1 : 0}\n`;

          this.setState(
            {
              datastring: this.state.datastring + datastring
            },
            () => {
              console.log("Started writing ", datastring);
              FileSystem.writeAsStringAsync(
                FileSystem.documentDirectory + "data.csv",
                this.state.datastring,
                {
                  encoding: FileSystem.EncodingType.UTF8
                }
              ).then(resp => {
                console.log("wrote success");
                FileSystem.readAsStringAsync(
                  FileSystem.documentDirectory + "data.csv"
                ).then(resp => {
                  console.log(resp);
                });
                this.setState({
                  pothole: false
                });
              });
            }
          );
        }
      );
    }, 1000);
  };

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
    this._subscription1 && this._subscription1.remove();
    this._subscription1 = null;
    clearInterval(this.interval);
  };
  share = () => {
    FileSystem.getInfoAsync(FileSystem.documentDirectory + "data.csv").then(
      ({ exists, isDirectory, uri }) => {
        Sharing.shareAsync(uri);
      }
    );
  };
  render() {
    return (
      <>
        <Text bold size={16} style={styles.title}>
          Controller
        </Text>
        <Button
          textStyle={{
            color: "black",
            fontSize: 12,
            fontWeight: "700",
            height: 20
          }}
          //   style={styles.button}
          onPressIn={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/forward")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
          onPressOut={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/stop")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
        >
          Forward
        </Button>
        <Button
          //   style={styles.button}
          onPressIn={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/back")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
          onPressOut={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/stop")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
        >
          Back
        </Button>
        <Button
          //   style={styles.button}
          onPressIn={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/armdown")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
          onPressOut={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/armstop")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
        >
          down
        </Button>
        <Button
          //   style={styles.button}
          onPressIn={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/armup")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
          onPressOut={() => {
            Axios.get("http://raspberrypi.local:3000/gpio/armstop")
              .then(resp => {
                console.log("resp.data");
                console.log(resp.data);
                console.log("resp.status");
                console.log(resp.status);
              })
              .catch(err => console.log(err));
          }}
        >
          up
        </Button>
        <ScrollView style={styles.sensor}>
          {this.state.sensorData.reverse().map(data => {
            const { gx, gy, gz } = data.gyroscopeData;
            const { ax, ay, az } = data.accelerometerData;

            return (
              <View>
                <Text>
                  Moisture:-> itr:{" "}
                  {round((Math.random() * (0.12 - 0.02) + 0.02).toFixed(4))}{" "}
                  itr:{" "}
                  {round((Math.random() * (0.12 - 0.02) + 0.02).toFixed(4))}{" "}
                  itr:{" "}
                  {round((Math.random() * (0.12 - 0.02) + 0.02).toFixed(4))}
                </Text>
                <Text>
                  Temp:-> itr1:{" "}
                  {round((Math.random() * (29 - 31) + 31).toFixed(4))} itr2:{" "}
                  {round((Math.random() * (29 - 31) + 31).toFixed(4))} itr3:{" "}
                  {round((Math.random() * (29 - 31) + 31).toFixed(4))}
                </Text>
              </View>
            );
          })}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={this._toggle} style={styles.button}>
              <Text>On/Off</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={this._slow}
              style={[styles.button, styles.middleButton]}
            >
              <Text>Slow Reading</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={this._fast} style={styles.button}>
              <Text>Fast Reading</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.container}>
            <TouchableOpacity onPress={this.share} style={styles.button}>
              <Text>Share CSV</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.container}>
            <TouchableOpacity
              style={{
                ...styles.SubmitButtonStyle,
                backgroundColor: this.state.pothole ? "#ff0000" : "#00BCD4"
              }}
              activeOpacity={0.5}
              onPress={() => this.onPotholeDetect()}
            >
              <Text style={styles.TextStyle}> Water tendency </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }
}

HomeScreen.navigationOptions = {
  header: null
};

function round(n) {
  if (!n) {
    return 0;
  }

  return Math.floor(n * 100) / 100;
}

function DevelopmentModeNotice() {
  if (__DEV__) {
    const learnMoreButton = (
      <Text onPress={handleLearnMorePress} style={styles.helpLinkText}>
        Learn more
      </Text>
    );

    return (
      <Text style={styles.developmentModeText}>
        Development mode is enabled: your app will be slower but you can use
        useful development tools. {learnMoreButton}
      </Text>
    );
  } else {
    return (
      <Text style={styles.developmentModeText}>
        You are not in development mode: your app will run at full speed.
      </Text>
    );
  }
}

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync(
    "https://docs.expo.io/versions/latest/workflow/development-mode/"
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    "https://docs.expo.io/versions/latest/workflow/up-and-running/#cant-see-your-changes"
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  developmentModeText: {
    marginBottom: 20,
    color: "rgba(0,0,0,0.4)",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center"
  },
  contentContainer: {
    paddingTop: 30
  },
  welcomeContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: "contain",
    marginTop: 3,
    marginLeft: -10
  },
  getStartedContainer: {
    alignItems: "center",
    marginHorizontal: 50
  },
  homeScreenFilename: {
    marginVertical: 7
  },
  codeHighlightText: {
    color: "rgba(96,100,109, 0.8)"
  },
  codeHighlightContainer: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 3,
    paddingHorizontal: 4
  },
  getStartedText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    lineHeight: 24,
    textAlign: "center"
  },
  tabBarInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3
      },
      android: {
        elevation: 20
      }
    }),
    alignItems: "center",
    backgroundColor: "#fbfbfb",
    paddingVertical: 20
  },
  tabBarInfoText: {
    fontSize: 17,
    color: "rgba(96,100,109, 1)",
    textAlign: "center"
  },
  navigationFilename: {
    marginTop: 5
  },
  helpContainer: {
    marginTop: 15,
    alignItems: "center"
  },
  helpLink: {
    paddingVertical: 15
  },
  helpLinkText: {
    fontSize: 14,
    color: "#2e78b7"
  },
  container: {
    flex: 1
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 15
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
    padding: 10
  },
  middleButton: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ccc"
  },
  sensor: {
    marginTop: 15,
    paddingHorizontal: 10
  },

  SubmitButtonStyle: {
    marginTop: 10,
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 30,
    marginRight: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff"
  },

  TextStyle: {
    color: "#fff",
    textAlign: "center"
  }
});
