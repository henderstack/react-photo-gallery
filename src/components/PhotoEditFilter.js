import React, { Component } from 'react';

const filters = [
  {
    label: 'brightness',
    value: 1,
    icon: 'brightness_5'
  },
  {
    label: 'grayscale',
    value: 0,
    icon: 'brightness_1'
  },
  {
    label: 'contrast',
    value: 1,
    icon: 'brightness_6'
  },
  {
    label: 'hue',
    value: 0,
    icon: 'brightness_3'
  },
  {
    label: 'sepia',
    value: 0,
    icon: 'brightness_1'
  },
   {
    label: 'saturate',
    value: 1,
     icon: 'brightness_7'
  }, 
]

const Photo = (props) => {
  return (
    <div className="photo">
      <img style={props.style} src="https://images.unsplash.com/photo-1439853949127-fa647821eba0?dpr=1&auto=format&fit=crop&w=1000&q=80&cs=tinysrgb" />
      <div className={props.className}></div>
    </div>
  )
}

const Modes = (props) => {
  return (
    <div className="modes">
      <div id="multiply" className="modes-item modes-item--multiply" onClick={props.onClick}></div>
      <div id="overlay" className="modes-item modes-item--overlay" onClick={props.onClick}></div>
      <div id="darken" className="modes-item modes-item--darken" onClick={props.onClick}></div>
      <div id="lighten" className="modes-item modes-item--lighten" onClick={props.onClick}></div>
      <div id="exclusion" className="modes-item modes-item--exclusion" onClick={props.onClick}></div>
      <div id="difference" className="modes-item modes-item--difference" onClick={props.onClick}></div>
      <div id="screen" className="modes-item modes-item--screen" onClick={props.onClick}></div>
      <div id="luminosity" className="modes-item modes-item--luminosity" onClick={props.onClick}></div>      
    </div>
  )
}

const Item = (props) => {
  return (
    <div className="filter-item">
      <label>{props.label}</label>
      <i className="material-icons">{props.icon}</i>
      <input name={props.label} type="range" defaultValue={props.value} id={props.index} onChange={props.onChange}/>
    </div>
  )
}

const Filter = (props) => {
  
  let item = props.filters.map((item, index) => {
    return (
      <Item index={index} label={item.label} icon={item.icon} value={item.value} onChange={props.onChange}/>
    )
  })
  
  return (
    <div className="filter">
      {item}
      <Modes onClick={props.handleModes}/>
    </div>
  )
}

class PhotoEditFilter extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filters: filters,
      mode: false
    }
    this.onChange = this.onChange.bind(this)
    this.handleModes = this.handleModes.bind(this)
  }
  
  render() {
    
    let style = {
      filter: 'grayScale(' + this.state.filters[1].value + ')' +
      'hue-rotate(' + this.state.filters[3].value + 'deg)' +
      'brightness(' + this.state.filters[0].value + ')' +
      'contrast(' + this.state.filters[2].value + ')' +
      'sepia(' + this.state.filters[4].value + ')' +
      'saturate(' + this.state.filters[5].value + ')'
    }
    
    return (
      <div className="container">
        <Photo style={style} className={this.state.mode ? 'photo-mode photo-mode--' + this.state.modeClass : 'photo-mode'}/>        
        <Filter filters={this.state.filters} onChange={this.onChange} handleModes={this.handleModes}/>
      </div>
    )
  }
  
  handleModes(event) {
    let name = event.target.id
    this.setState({
      modeClass: name,
      mode: true
    })
  }
  
  onChange(event) {
    this.setState({
      mode: false
    })
    let filterId = Number(event.target.id),
        filters = this.state.filters,
        value = Number(event.target.value),
        name = event.target.name
    if (name == 'grayscale') {
      filters[filterId].value = value / 100
    } else if (name == 'hue') {
      filters[filterId].value = value * 3.6
    } else if (name == 'brightness') {
      filters[filterId].value = value < 1 ? 1 : (1 + value / 10)
    } else if (name == 'contrast') {
      filters[filterId].value = value < 1 ? 1 : (1 + value / 10)
    } else if (name == 'sepia') {
      filters[filterId].value = value / 100
    } else if (name == 'saturate') {
      filters[filterId].value = value < 1 ? 1 : (1 + value / 10)
    }
    this.setState({
      filters: filters
    })
  }
}

export default PhotoEditFilter;