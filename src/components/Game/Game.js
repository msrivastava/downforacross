import 'react-flexview/lib/flexView.css';

import React, {Component} from 'react';
import Flex from 'react-flexview';
import _ from 'lodash';
import Confetti from './Confetti.js';

import * as powerups from '../../lib/powerups';
import Player from '../Player';
import Toolbar from '../Toolbar';
import {toArr} from '../../lib/jsUtils';
import {toHex, darken, GREENISH} from '../../lib/colors';
import {apiLogMessage} from '../../lib/apiserver';

// component for gameplay -- incl. grid/clues & toolbar
export default class Game extends Component {
  constructor() {
    super();
    this.state = {
      pencilMode: false,
      autocheckMode: false,
      screenWidth: 0,
      vimMode: false,
      vimInsert: false,
      colorAttributionMode: false,
    };
  }

  componentDidMount() {
    const screenWidth = window.innerWidth - 1; // this is important for mobile to fit on screen
    // with body { overflow: hidden }, it should disable swipe-to-scroll on iOS safari)
    this.setState({
      screenWidth,
    });
    this.componentDidUpdate({});
  }

  componentDidUpdate(prevProps) {
    if (prevProps.myColor !== this.props.myColor) {
      this.handleUpdateColor(this.props.id, this.props.myColor);
    }
  }

  get rawGame() {
    return this.props.historyWrapper && this.props.historyWrapper.getSnapshot();
  }

  get rawOpponentGame() {
    return this.props.opponentHistoryWrapper && this.props.opponentHistoryWrapper.getSnapshot();
  }

  // TODO: this should be cached, sigh...
  get games() {
    return powerups.apply(
      this.rawGame,
      this.rawOpponentGame,
      this.props.ownPowerups,
      this.props.opponentPowerups
    );
  }

  get game() {
    return this.games.ownGame;
  }

  get opponentGame() {
    return this.games.opponentGame;
  }

  get gameModel() {
    return this.props.gameModel;
  }

  scope(s) {
    if (s === 'square') {
      return this.player.getSelectedSquares();
    }
    if (s === 'word') {
      return this.player.getSelectedAndHighlightedSquares();
    }
    if (s === 'puzzle') {
      return this.player.getAllSquares();
    }
    return [];
  }

  handleUpdateGrid = (r, c, value) => {
    const {id, myColor} = this.props;
    const {pencilMode} = this.state;
    const {autocheckMode} = this.state;
    const log_message = `CellUpdate,${id},${r},${c},${value}`;
    console.log('*** MBS: ' + log_message);
    apiLogMessage(log_message + ',' + JSON.stringify(this.rawGame));
    if (autocheckMode) {
      this.gameModel.updateCellAutocheck(r, c, id, myColor, pencilMode, value);
    } else {
      this.gameModel.updateCell(r, c, id, myColor, pencilMode, value);
    }
    // console.log(JSON.stringify(this.gameModel))
    this.props.onChange({isEdit: true});

    this.props.battleModel && this.props.battleModel.checkPickups(r, c, this.rawGame, this.props.team);
  };

  handleUpdateCursor = ({r, c}) => {
    const {id} = this.props;
    if (this.game.solved && !_.find(this.game.cursors, (cursor) => cursor.id === id)) {
      return;
    }
    this.gameModel.updateCursor(r, c, id);
  };

  handleAddPing = ({r, c}) => {
    const {id} = this.props;
    this.gameModel.addPing(r, c, id);
  };

  handleUpdateColor = (id, color) => {
    this.gameModel.updateColor(id, color);
  };

  handleStartClock = () => {
    this.props.gameModel.updateClock('start');
  };

  handlePauseClock = () => {
    this.props.gameModel.updateClock('pause');
  };

  handleResetClock = () => {
    this.props.gameModel.updateClock('reset');
  };

  handleCheck = (scopeString) => {
    const {id} = this.props;
    const scope = this.scope(scopeString);
    const log_message = `Check,${id},${scopeString},${JSON.stringify(scope)}`;
    console.log('*** MBS: ' + log_message);
    apiLogMessage(log_message);
    this.props.gameModel.check(scope);
  };

  handleReveal = (scopeString) => {
    const {id} = this.props;
    const scope = this.scope(scopeString);
    const log_message = `Reveal,${id},${scopeString},${JSON.stringify(scope)}`;
    console.log('*** MBS: ' + log_message);
    apiLogMessage(log_message);
    this.props.gameModel.reveal(scope);
    this.props.onChange();
  };

  handleReset = (scopeString) => {
    const {id} = this.props;
    const scope = this.scope(scopeString);
    const log_message = `Reset,${id},${scopeString},${JSON.stringify(scope)}`;
    console.log('*** MBS: ' + log_message);
    apiLogMessage(log_message);
    this.props.gameModel.reset(scope);
  };

  handleKeybind = (mode) => {
    this.setState({
      vimMode: mode === 'vim',
    });
  };

  handleVimInsert = () => {
    this.setState({
      vimInsert: true,
    });
  };

  handleVimNormal = () => {
    this.setState({
      vimInsert: false,
    });
  };

  handleTogglePencil = () => {
    this.setState((prevState) => ({
      pencilMode: !prevState.pencilMode,
    }));
  };

  handleToggleAutocheck = () => {
    this.setState((prevState) => ({
      autocheckMode: !prevState.autocheckMode,
    }));
  };

  handleToggleChat = () => {
    this.props.onToggleChat();
  };

  handleGiveUp = () => {
    const {id} = this.props;
    const minutes_played = document
      .getElementsByClassName('clock')[0]
      .innerHTML.replace(/[{()}]/g, '')
      .split(':')[0];
    console.log('*** MBS: ' + minutes_played);
    // alert(minutes_played);
    if (parseInt(minutes_played, 10) < 1) {
      alert(`You have only played ${minutes_played} minutes. Can't quit yet!`);
    } else {
      if (
        window.confirm(`You have played ${minutes_played} minutes. Are you sure that you want to quit?`) ==
        true
      ) {
        const code = Math.floor(Math.random() * 1000000);
        window.alert(`Okay, I will quit! Your secret code is ${code}`);
        const log_message = `GiveUp,${id},${code}`;
        console.log('*** MBS: ' + log_message);
        apiLogMessage(log_message);
        //this.props.gameModel.reset(scope);
        this.handleReset('puzzle');
        this.handleResetClock();
        //console.log('*** MBS: totalTime=' + this.rawGame.clock.totalTime);
        //console.log('*** MBS: ' + JSON.stringify(this.rawGame.clock));
        //Object.keys(this.props).forEach((prop)=> console.log('*** MBS: '+prop));
        //console.log('*** MBS: ' +JSON.stringify(this, null, 4))
        // this.props.gameModel.reset(scope);
      } else {
        window.alert(`Okay, I will not quit!`);
      }
    }
  };

  handleRefocus = () => {
    this.focus();
  };

  handlePressPeriod = this.handleTogglePencil;

  handlePressEnter = () => {
    this.props.onUnfocus();
  };

  focus() {
    this.player && this.player.focus();
  }

  renderPlayer() {
    const {id, myColor, mobile, beta} = this.props;
    if (!this.game) {
      return <div>Loading...</div>;
    }

    const {
      grid,
      circles,
      shades,
      cursors,
      pings,
      users,
      solved,
      solution,
      themeColor,
      optimisticCounter,
    } = this.game;
    const clues = {
      ...this.game.clues,
    };
    if (window.location.host === 'foracross.com' || window.location.host.includes('.foracross.com')) {
      const dirToHide = window.location.host.includes('down') ? 'across' : 'down';
      clues[dirToHide] = _.assign([], clues[dirToHide]).map((val) => val && '-');
    }
    const opponentGrid = this.opponentGame && this.opponentGame.grid;
    const {screenWidth} = this.state;
    const themeStyles = {
      clueBarStyle: {
        backgroundColor: toHex(themeColor),
      },
      gridStyle: {
        cellStyle: {
          selected: {
            backgroundColor: myColor,
          },
          highlighted: {
            backgroundColor: toHex(darken(themeColor)),
          },
          frozen: {
            backgroundColor: toHex(GREENISH),
          },
        },
      },
    };
    const cols = grid[0].length;
    const rows = grid.length;
    const width = Math.min((35 * 15 * cols) / rows, screenWidth);
    const minSize = this.props.mobile ? 1 : 20;
    const size = Math.max(minSize, width / cols);
    return (
      <Player
        ref={(c) => {
          this.player = c;
        }}
        beta={beta}
        size={size}
        grid={grid}
        solution={solution}
        opponentGrid={opponentGrid}
        circles={circles}
        shades={shades}
        clues={{
          across: toArr(clues.across),
          down: toArr(clues.down),
        }}
        id={id}
        cursors={cursors}
        pings={pings}
        users={users}
        frozen={solved}
        myColor={myColor}
        updateGrid={this.handleUpdateGrid}
        updateCursor={this.handleUpdateCursor}
        addPing={this.handleAddPing}
        onPressEnter={this.handlePressEnter}
        onPressPeriod={this.handlePressPeriod}
        vimMode={this.state.vimMode}
        vimInsert={this.state.vimInsert}
        onVimInsert={this.handleVimInsert}
        onVimNormal={this.handleVimNormal}
        colorAttributionMode={this.state.colorAttributionMode}
        mobile={mobile}
        pickups={this.props.pickups}
        optimisticCounter={optimisticCounter}
        onCheck={this.handleCheck}
        onReveal={this.handleReveal}
        {...themeStyles}
      />
    );
  }

  renderToolbar() {
    if (!this.game) return;
    const {clock} = this.game;
    const {mobile} = this.props;
    const {pencilMode, autocheckMode, vimMode, vimInsert} = this.state;
    const {lastUpdated: startTime, totalTime: pausedTime, paused: isPaused} = clock;
    return (
      <Toolbar
        v2
        mobile={mobile}
        startTime={startTime}
        pausedTime={pausedTime}
        isPaused={isPaused}
        pencilMode={pencilMode}
        autocheckMode={autocheckMode}
        vimMode={vimMode}
        vimInsert={vimInsert}
        onStartClock={this.handleStartClock}
        onPauseClock={this.handlePauseClock}
        onResetClock={this.handleResetClock}
        onCheck={this.handleCheck}
        onReveal={this.handleReveal}
        onReset={this.handleReset}
        onKeybind={this.handleKeybind}
        onTogglePencil={this.handleTogglePencil}
        onToggleAutocheck={this.handleToggleAutocheck}
        onToggleChat={this.handleToggleChat}
        onGiveUp={this.handleGiveUp}
        colorAttributionMode={this.state.colorAttributionMode}
        onToggleColorAttributionMode={() => {
          this.setState((prevState) => ({colorAttributionMode: !prevState.colorAttributionMode}));
        }}
        onRefocus={this.handleRefocus}
        unreads={this.props.unreads}
      />
    );
  }

  renderGameStatus() {
    if (!this.game.solved) {
      return <div>Game Status: Unsolved</div>;
    } else {
      const {id} = this.props;
      const log_message = `Solved,${id},${JSON.stringify(this.rawGame)}}`;
      console.log('*** MBS: ' + log_message);
      apiLogMessage(log_message);
      const code = Math.floor(Math.random() * 1000000);
      return <div>Game Status: Solved (Your secret code = {code})</div>;
    }
  }

  render() {
    const padding = this.props.mobile ? 0 : 20;
    return (
      <Flex column grow={1}>
        {this.renderToolbar()}
        <Flex
          grow={1}
          style={{
            padding,
          }}
        >
          {this.renderPlayer()}
        </Flex>
        {this.game.solved && !this.props.mobile && <Confetti />}
        {this.renderGameStatus()}
      </Flex>
    );
  }
}
