import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Picker,
    Platform,
    Vibration,
    Alert
} from 'react-native';
import AnimatedLinearGradient, {presetColors} from 'react-native-animated-linear-gradient';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {clear} from "react-native/Libraries/LogBox/Data/LogBoxData";

const screen = Dimensions.get('window'); // tells us dimensions of screen (using the API from 'react-native' package)

const styles = StyleSheet.create({
    container: {
        flex: 1, // flex of 1 allows us to utilize entire area of screen
        backgroundColor: '#07121B',
        alignItems: 'center', // vertically center
        justifyContent: 'center', // horizontally center
    },
    button: {
        borderWidth: 10,
        borderColor: "#a7e9af", // change color of button using 'borderColor' property
        width: screen.width / 2, // set width of button to be half of screen width
        height: screen.width / 2, // set height of button to be half of screen width
        borderRadius: screen.width / 2, // this is what makes the button a circle
        alignItems: 'center', // align and justify content within the button, just like above container object
        justifyContent: 'center',
        marginTop: 30, // add some breathing room between button component and timer text component
        opacity: .7
    },
    buttonText: {
        fontSize: 45,
        color: "#a7e9af" // change color of text using 'color' property
    },
    buttonStop: {
        borderColor: "#d63447",
    },
    buttonTextStop: {
        color: "#d63447",
    },
    timerText: {
        color: '#fff',
        fontSize: 70
    },
    picker: {
        width: 50,
        // use ... spread operator to get styles from picker into Platform.select (in our case, Android)
        ...Platform.select({
            android: {
                color: '#fff',
                backgroundColor: '#07121B',
                marginLeft: 10
            }
        })
    },
    pickerItem: {
        color: "#fff",
        fontSize: 20
    },
    pickerContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
});

/* Format timer view using string interpolation so that it is in the format
   of 00:00
   Note: we omit the 'return' keyword here because the computation occurs
   one line
   Ex: 3 -> 03, 10 -> 10
 */
const formatNumber = (number) => `0${number}`.slice(-2)

/* Define a function (using fat arrow notation) that
   converts remainingSeconds in the state to a user
   friendly format to be rendered in a Text component
*/
const getRemaining = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time - (hours * 3600)) / 60)
    const seconds = time - (minutes * 60);
    return {hours: formatNumber(hours), minutes: formatNumber(minutes), seconds: formatNumber(seconds)};
}

/* Define a function that returns a populated
   array of strings (for use in generating picker items for the timer)
 */
const createArray = length => {
    const arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(i.toString());
    }
    return arr;
}

// arrays for use in pickers
const AVAILABLE_HOURS = createArray(24);
const AVAILABLE_MINUTES = createArray(60);
const AVAILABLE_SECONDS = createArray(60);

// const for vibration pattern
const ONE_SECOND_IN_MS = 1000;

const PATTERN = [
    1 * ONE_SECOND_IN_MS,
    1 * ONE_SECOND_IN_MS,
    1 * ONE_SECOND_IN_MS
];

// SOUND
// Import the react-native-sound module
var Sound = require('react-native-sound');

// Enable playback in silence mode
Sound.setCategory('Playback');

// Background color
const colorific = [
    'rgb(95, 221, 229)',
    'rgb(243, 113, 33)',
    'rgb(244, 234, 142)',
    'rgb(217, 32, 39)',
    'rgb(255,113,178)'
]

export default class App extends React.Component {
    state =
        {
            remainingSeconds: 5,
            isRunning: false, // used to keep track of whether or not a timer is running
            selectedHours: "0",
            selectedMinutes: "0",
            selectedSeconds: "10"
        }

    interval = null;


    // stop time with another component lifecycle, which takes a prevProp and prevState
    componentDidUpdate(prevProp, prevState) {
        // we check prevState because stop resets state.remainingSeconds to 5, so there would otherwise
        // have been an infinite loop, calling a max call stack error
        if (this.state.remainingSeconds === 0 && prevState.remainingSeconds !== 0) {
            this.stop();
        }
    }

    // when component unmounts, clear interval to avoid memory leaks within application (component lifecycle!)
    componentWillUnmount() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    // stop vibration and ringing when timer runs out with an alert
    twoButtonAlert = (TimeIsNow) =>
        Alert.alert(
            "Your time is up!",
            "My time is now.",
            [
                {
                    text: "Cancel",
                    onPress: () => {
                        Vibration.cancel();
                        TimeIsNow.stop(() => {
                            // Note: If you want to play a sound after stopping and rewinding it,
                            // it is important to call play() in a callback.
                        });
                    },
                    style: "cancel"
                },
                {
                    text: "OK", onPress: () => {
                        Vibration.cancel();
                        TimeIsNow.stop(() => {
                            // Note: If you want to play a sound after stopping and rewinding it,
                            // it is important to call play() in a callback.
                        });
                    }
                }
            ],
            {cancelable: false}
        );

    /* declare function that deprecates time within App component (changes to state occur within App component)
       start function deprecates the dynamic remainingSeconds by 1 using this.setState, which we always require when
       updating a class component state
     */
    start = () => {
        this.setState(state => ({
            remainingSeconds: parseInt(state.selectedHours, 10) * 3600 + parseInt(state.selectedMinutes, 10)
                * 60 + parseInt(state.selectedSeconds),
            isRunning: true,
        }));
        // use setInterval to deprecate remainingSeconds every 1000 milliseconds
        this.interval = setInterval(() => {
            this.setState(state => ({
                remainingSeconds: state.remainingSeconds - 1
            }));
        }, 1000);
    };

    // stop time and set default seconds to 5
    stop = () => {
        clearInterval(this.interval);
        this.interval = null;
        this.setState({remainingSeconds: 5, isRunning: false,});
        // Load the sound file 'TimeIsNow.mp3' from the app bundle
        var TimeIsNow = new Sound('TimeIsNow.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
            // loaded successfully
            console.log('duration in seconds: ' + TimeIsNow.getDuration() + 'number of channels: ' + TimeIsNow.getNumberOfChannels());
            TimeIsNow.play((success) => {
                if (success) {
                    console.log('successfully finished playing');
                } else {
                    console.log('playback failed due to audio decoding errors');
                }
            });

        });
        Vibration.vibrate(PATTERN, true)
        // Play the sound with an onEnd callback
        this.twoButtonAlert(TimeIsNow);
    }

    // renders pickers for timer app
    renderPickers = () => {
        return (
            <View style={styles.pickerContainer}>
                <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem} // customize each of the Picker.Items
                    selectedValue={this.state.selectedHours} // selectedValue expects a string
                    onValueChange={itemValue => {
                        // update state
                        this.setState({selectedHours: itemValue});
                    }}
                    mode="dropdown"
                >
                    {AVAILABLE_HOURS.map(value => ( // map strings from AVAILABLE_HOURS to a picker item
                        <Picker.Item key={value} label={value} value={value}/>
                    ))}
                </Picker>
                <Text style={styles.pickerItem}>hr</Text>
                <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem} // customize each of the Picker.Items
                    selectedValue={this.state.selectedMinutes} // selectedValue expects a string
                    onValueChange={itemValue => {
                        // update state
                        this.setState({selectedMinutes: itemValue});
                    }}
                    mode="dropdown"
                >
                    {AVAILABLE_MINUTES.map(value => ( // map strings from AVAILABLE_MINUTES to a picker item
                        <Picker.Item key={value} label={value} value={value}/>
                    ))}
                </Picker>
                <Text style={styles.pickerItem}>min</Text>
                <Picker
                    style={styles.picker}
                    itemStyle={styles.pickerItem} // customize each of the Picker.Items
                    selectedValue={this.state.selectedSeconds}
                    onValueChange={itemValue => {
                        this.setState({selectedSeconds: itemValue});
                    }}
                    mode="dropdown"
                >
                    {AVAILABLE_SECONDS.map(value => ( // map strings from AVAILABLE_SECONDS to a picker item
                        <Picker.Item key={value} label={value} value={value}/>
                    ))}
                </Picker>
                <Text style={styles.pickerItem}>sec</Text>
            </View>
        );
    }

    render() {
        const {hours, minutes, seconds} = getRemaining(this.state.remainingSeconds); // use object destructuring
        return (
            /* StatusBar component is self-closing -- allows us to make clock/battery indicator a different color
               from the background
               -
               TouchableOpacity component is a button, and utilizes the onPress prop
               -
               Notice the array of styles within the stop button (StyleSheet API in React lets us stack styles!)
               -
               Use a ternary conditional (condition = if state is running) to display one button at a time
             */

            <View style={styles.container}>
                <StatusBar barStyle="light-content"/>
                <AnimatedLinearGradient customColors={colorific} speed={4000}/>
                {this.state.isRunning ?
                    (
                        <Text style={styles.timerText}>{`${hours}:${minutes}:${seconds}`}</Text>)
                    :
                    (this.renderPickers())}
                {this.state.isRunning ?
                    (<TouchableOpacity onPress={this.stop} style={[styles.button, styles.buttonStop]}>
                            <Text style={[styles.buttonText, styles.buttonTextStop]}>Stop</Text>
                        </TouchableOpacity>
                    )
                    :
                    (<TouchableOpacity onPress={this.start} style={styles.button}>
                        <Text style={styles.buttonText}>Start</Text>
                    </TouchableOpacity>)
                }
            </View>
        );
    }
}