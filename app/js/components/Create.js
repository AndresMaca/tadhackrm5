import React, {Component, Fragment} from 'react';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import LinearProgress from '@material-ui/core/LinearProgress';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import {withStyles} from '@material-ui/core/styles';

import EmbarkJS from 'Embark/EmbarkJS';
import web3 from 'Embark/web3';
import DReddit from 'Embark/contracts/DReddit';


const styles = theme => ({
  textField: {
    marginRight: theme.spacing.unit * 2
  }
});

class Create extends Component{

  constructor(props){
    super(props);
    
    this.state = {
      'title': '',
      'content': '',
      'picture': '',
      'imageHash' : '',
      'isSubmitting': false,
      'error': ''
    };
  }

  handleClick = async event => {
    event.preventDefault();

    if(this.state.title.trim() == ''){
      this.setState({'error': 'Required field'});
      return;
    }

    this.setState({
      isSubmitting: true, 
      error: ''
    });
    let hash = '';
    
    if (this.state.picture !== '') {
      console.log("Si hay imagen")
      try {
        // upload the file to ipfs and get the resulting hash
        console.log("Hash:");
        this.state.imageHash = await EmbarkJS.Storage.uploadFile([this.inputPicture]);
        console.log(this.state.imageHash)
      }
      catch (err) {
        // stop loading state and show user the error
        return this.setState({ isSubmitting: false,  error: err.message });
      }
    }else{
      console.log("Nohay imagen");
    }  
    const textToSave = {
      'title': this.state.title,
      'content': this.state.content, 
      'imageHash': this.state.imageHash
    };
    console.log("text to save: ")
    console.log(textToSave)

    // Save the previous object in IPFS
    const ipfsHash = await EmbarkJS.Storage.saveText(JSON.stringify(textToSave));

    // Estimate gas required to invoke the `create` function from the contract
    const {create} = DReddit.methods;    
    const toSend = await create(web3.utils.toHex(ipfsHash));
    const estimatedGas = await toSend.estimateGas();

    // Send the transaction
    const receipt = await toSend.send({from: web3.eth.defaultAccount, 
                                       gas: estimatedGas + 1000});

    console.log(receipt);

    this.setState({
      isSubmitting: false,
      content: '',
      title: ''
    });

    this.props.afterPublish();
  }

  handleChange = name => event => {
    this.setState({
      [name]: event.target.value
    });
  };

  render(){
    const {classes} = this.props;
    const {error, content, picture, title, isSubmitting} = this.state;

    return (<Fragment>
      <Card>
        <CardContent>
          <TextField
            id="title"
            label="Title"
            error={error != ""}
            multiline
            rowsMax="20"
            fullWidth
            value={title}
            helperText={error}
            onChange={this.handleChange('title')}
            className={classes.textField}
            margin="normal" />
          <TextField
            id="description"
            label="Description"
            error={error != ""}
            multiline
            rowsMax="20"
            fullWidth
            value={content}
            helperText={error}
            onChange={this.handleChange('content')}
            className={classes.textField}
            margin="normal" />
          <TextField
                type="file"
                value={ picture }
                onChange={this.handleChange('picture')}
                name="picture"
                label="Profile picture"
                inputRef={ (input) => this.inputPicture = input }
                
              />
          {
            <Button variant="contained" color="primary" onClick={this.handleClick} disabled={isSubmitting }>Publish</Button>
          }
        </CardContent>
      </Card>
      { this.state.isSubmitting && <LinearProgress /> }
      </Fragment>
    );
  }
}

Create.propTypes = {
  classes: PropTypes.object.isRequired,
  afterPublish: PropTypes.func.isRequired
};

export default withStyles(styles)(Create);
