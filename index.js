/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import FirebaseData from './src/storage/FirebaseData';
AppRegistry.registerComponent(appName, () => FirebaseData);
