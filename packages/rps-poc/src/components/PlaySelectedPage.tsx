import React from 'react';

import { Play } from '../game-engine/positions';
import MoveIcon from './MoveIcon';
import Button from './Button';

interface Props {
  message: string;
  yourPlay: Play;
  challengeOnChain: ()=>void;
}

export default class PlaySelectedPage extends React.PureComponent<Props> {
  static defaultProps = {
    selectedPlayId: null,
  };

  render() {
    const { message, yourPlay,challengeOnChain } = this.props;

    return (
      <div className="container centered-container">
        <div className="w-100 text-center mb-5">
          <h1 className="mb-5">Move chosen!</h1>
          <p className="lead">
            You chose <strong>{Play[yourPlay]}</strong>
          </p>

          <div className="mb-5">
            <MoveIcon play={yourPlay} />`
          </div>
          <Button onClick={challengeOnChain}>Challenge</Button>
          <p>{message}</p>
        </div>
      </div>
    );
  }
}
