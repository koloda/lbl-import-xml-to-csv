// @flow
import React, { Component } from 'react';
import {
  Radio,
  View,
  Label,
  Button,
  ProgressCircle
} from 'react-desktop/windows';

import {observer} from 'mobx-react';

import styles from './Home.css';

import processCardo from '../controllers/processing/cardo';

import appState from '../stores/UI';

@observer class Home extends Component {
  static defaultProps = {
    btnDefLabel: 'Почнемо!',
    btnActLabel: 'Чекаємо, це займе трохи часу',
  };

    runProcessing() {
        if (!appState.processingIsStarted)
            processCardo();
        appState.startProcessing();
    }

  stopProcessing() {
    // this.
  }

  render() {
    return (
      <View
        height="100%"
        width="100%"
        layout="vertical"
      >
        <View width="100%" horizontalAlignment="center">
          <Label>Спарсимо дані?</Label>
        </View>

        <View margin="20px 0px 0px 20px">
          <Radio
            label="Cardo"
            defaultChecked
          />
        </View>
        <View horizontalAlignment="center" layout="vertical">
          <Button
            push
            onClick={this.runProcessing.bind(this)}
          >{appState.processingIsStarted?this.props.btnActLabel:this.props.btnDefLabel}</Button>
          <ProgressCircle
            size="60"
            hidden={!appState.processingIsStarted}
          />
        </View>
        <View horizontalAlignment="center" padding="40px 0 0 0">
          <Label
            background="#bee6fd"
            hidden={!appState.infoText.length}
          >{appState.infoText}</Label>
        </View>
      </View>
    );
  }
}


export default Home;
