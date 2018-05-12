import React from 'react'
import { mount, render } from 'enzyme'
import { spy, stub } from 'sinon'
import { onDocumentDragOver } from './utils'

const DropLoader = require(process.env.JEST_TARGET ? process.env.JEST_TARGET : './index') // eslint-disable-line import/no-dynamic-require
const DummyChildComponent = () => null

let files
let images

const rejectColor = 'red'
const acceptColor = 'green'

const rejectStyle = {
  color: rejectColor,
  borderColor: 'black'
}

const acceptStyle = {
  color: acceptColor,
  borderWidth: '5px'
}

describe('DropLoader', () => {
  beforeEach(() => {
    files = [
      {
        name: 'file1.pdf',
        size: 1111,
        type: 'application/pdf'
      }
    ]

    images = [
      {
        name: 'cats.gif',
        size: 1234,
        type: 'image/gif'
      },
      {
        name: 'dogs.jpg',
        size: 2345,
        type: 'image/jpeg'
      }
    ]
  })

  describe('basics', () => {
    it('should render children', () => {
      const droploader = mount(
        <DropLoader>
          <p>some content</p>
        </DropLoader>
      )
      expect(droploader.html()).toMatchSnapshot()
    })

    it('should render an input HTML element', () => {
      const droploader = mount(
        <Droploader>
          <p>some content</p>
        </Droploader>
      )
      expect(droploader.find('input').length).toEqual(1)
    })

    it('sets ref properly', () => {
      const droploader = mount(<DropLoader />)
      expect(droploader.instance().fileInputEl).not.toBeUndefined()
      expect(droploader.instance().fileInputEl.tagName).toEqual('INPUT')
    })

    it('renders dynamic props on the root element', () => {
      const component = mount(<DropLoader hidden aria-hidden title="DropLoader" />)
      expect(component.html()).toContain('aria-hidden="true"')
      expect(component.html()).toContain('hidden=""')
      expect(component.html()).toContain('title="DropLoader"')
    })

    it('renders dynamic props on the input element', () => {
      const component = mount(<DropLoader inputProps={{ id: 'hiddenFileInput' }} />)
      expect(component.find('input').html()).toContain('id="hiddenFileInput"')
    })

    it('applies the accept prop to the child input', () => {
      const component = render(<DropLoader className="my-droploader" accept="image/jpeg" />)
      expect(component.find('.my-droploader').attr()).not.toContain('accept')
      expect(Object.keys(component.find('input').attr())).toContain('accept')
      expect(component.find('input').attr('accept')).toEqual('image/jpeg')
    })

    it('applies the name prop to the child input', () => {
      const component = render(<DropLoader className="my-droploader" name="test-file-input" />)
      expect(component.find('.my-droploader').attr()).not.toContain('name')
      expect(Object.keys(component.find('input').attr())).toContain('name')
      expect(component.find('input').attr('name')).toEqual('test-file-input')
    })

    it('should render children function', () => {
      const content = <p>some content</p>
      const droploader = mount(<DropLoader>{content}</DropLoader>)
      const droploaderWithFunction = mount(<DropLoader>{() => content}</DropLoader>)
      expect(droploaderWithFunction.html()).toEqual(droploader.html())
    })
  })

  describe('document drop protection', () => {
    let droploader
    let addEventCalls
    let savedAddEventListener
    let savedRemoveEventListener

    beforeEach(() => {
      savedAddEventListener = document.addEventListener
      savedRemoveEventListener = document.removeEventListener
      document.addEventListener = spy()
      document.removeEventListener = spy()
    })

    afterEach(() => {
      document.addEventListener = savedAddEventListener
      document.removeEventListener = savedRemoveEventListener
    })

    // Collect the list of addEventListener/removeEventListener spy calls into an object keyed by event name.
    function collectEventListenerCalls(calls) {
      return calls.reduce((acc, [eventName, ...rest]) => {
        acc[eventName] = rest // eslint-disable-line no-param-reassign
        return acc
      }, {})
    }

    it('installs hooks to prevent stray drops from taking over the browser window', () => {
      droploader = mount(
        <DropLoader>
          <p>Content</p>
        </DropLoader>
      )
      expect(droploader.html()).toMatchSnapshot()
      expect(document.addEventListener.callCount).toEqual(2)
      addEventCalls = collectEventListenerCalls(document.addEventListener.args)
      Object.keys(addEventCalls).forEach(eventName => {
        expect(addEventCalls[eventName][0]).toBeDefined()
        expect(addEventCalls[eventName][1]).toBe(false)
      })
    })

    it('terminates drags and drops on elements outside our droploader', () => {
      const event = { preventDefault: spy() }
      onDocumentDragOver(event)
      expect(event.preventDefault.callCount).toEqual(1)
      event.preventDefault.reset()

      droploader.getNode().onDocumentDrop(event)
      expect(event.preventDefault.callCount).toEqual(1)
    })

    it('permits drags and drops on elements inside our droploader', () => {
      const instanceEvent = {
        preventDefault: spy(),
        target: droploader.getDOMNode()
      }
      droploader.getNode().onDocumentDrop(instanceEvent)
      expect(instanceEvent.preventDefault.callCount).toEqual(0)
    })

    it('removes document hooks when unmounted', () => {
      droploader.unmount()
      expect(document.removeEventListener.callCount).toEqual(2)
      const removeEventCalls = collectEventListenerCalls(document.removeEventListener.args)
      Object.keys(addEventCalls).forEach(eventName => {
        expect(removeEventCalls[eventName][0]).toEqual(addEventCalls[eventName][0])
      })
    })

    it('does not prevent stray drops when preventDropOnDocument is false', () => {
      droploader = mount(<DropLoader preventDropOnDocument={false} />)
      expect(droploader.html()).toMatchSnapshot()
      expect(document.addEventListener.callCount).toEqual(0)

      droploader.unmount()
      expect(document.removeEventListener.callCount).toEqual(0)
    })
  })

  describe('onClick', () => {
    it('should call `open` method', done => {
      const droploader = mount(<DropLoader />)
      spy(droploader.instance(), 'open')
      droploader.simulate('click')
      setTimeout(() => {
        expect(droploader.instance().open.callCount).toEqual(1)
        done()
      }, 0)
    })

    it('should not call `open` if disableClick prop is true', () => {
      const droploader = mount(<DropLoader disableClick />)
      spy(droploader.instance(), 'open')
      droploader.simulate('click')
      expect(droploader.instance().open.callCount).toEqual(0)
    })

    it('should call `onClick` callback if provided', done => {
      const clickSpy = spy()
      const droploader = mount(<DropLoader onClick={clickSpy} />)
      spy(droploader.instance(), 'open')
      droploader.simulate('click')
      setTimeout(() => {
        expect(droploader.instance().open.callCount).toEqual(1)
        expect(clickSpy.callCount).toEqual(1)
        done()
      }, 0)
    })

    it('should reset the value of input', () => {
      const droploader = mount(<DropLoader />)
      expect(
        droploader
          .render()
          .find('input')
          .attr('value')
      ).toBeUndefined()
      expect(
        droploader
          .render()
          .find('input')
          .attr('value', 10)
      ).not.toBeUndefined()
      droploader.simulate('click')
      expect(
        droploader
          .render()
          .find('input')
          .attr('value')
      ).toBeUndefined()
    })

    it('should trigger click even on the input', done => {
      const droploader = mount(<DropLoader />)
      const clickSpy = spy(droploader.instance().fileInputEl, 'click')
      droploader.simulate('click')
      droploader.simulate('click')
      setTimeout(() => {
        expect(clickSpy.callCount).toEqual(2)
        done()
      }, 0)
    })

    it('should not invoke onClick on the wrapper', () => {
      const onClickOuterSpy = spy()
      const onClickInnerSpy = spy()
      const component = mount(
        <div onClick={onClickOuterSpy}>
          <DropLoader onClick={onClickInnerSpy} />
        </div>
      )

      component.simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(1)
      expect(onClickInnerSpy.callCount).toEqual(0)

      onClickOuterSpy.reset()
      onClickInnerSpy.reset()

      component.find(DropLoader).simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(0)
      expect(onClickInnerSpy.callCount).toEqual(1)
    })

    it('should invoke onClick on the wrapper if disableClick is set', () => {
      const onClickOuterSpy = spy()
      const component = mount(
        <div onClick={onClickOuterSpy}>
          <DropLoader disableClick />
        </div>
      )

      component.find(DropLoader).simulate('click')
      expect(onClickOuterSpy.callCount).toEqual(1)
    })

    it('should invoke inputProps onClick if provided', done => {
      const inputPropsClickSpy = spy()
      const component = mount(<DropLoader inputProps={{ onClick: inputPropsClickSpy }} />)

      component.simulate('click')
      setTimeout(() => {
        expect(inputPropsClickSpy.callCount).toEqual(1)
        done()
      }, 0)
    })
  })

  describe('drag-n-drop', () => {
    it('should override onDrag* methods', () => {
      const dragStartSpy = spy()
      const dragEnterSpy = spy()
      const dragOverSpy = spy()
      const dragLeaveSpy = spy()
      const component = mount(
        <DropLoader
          onDragStart={dragStartSpy}
          onDragEnter={dragEnterSpy}
          onDragOver={dragOverSpy}
          onDragLeave={dragLeaveSpy}
        />
      )
      component.simulate('dragStart')
      component.simulate('dragEnter', { dataTransfer: { items: files } })
      component.simulate('dragOver', { dataTransfer: { items: files } })
      component.simulate('dragLeave', { dataTransfer: { items: files } })
      expect(dragStartSpy.callCount).toEqual(1)
      expect(dragEnterSpy.callCount).toEqual(1)
      expect(dragOverSpy.callCount).toEqual(1)
      expect(dragLeaveSpy.callCount).toEqual(1)
    })

    it('should guard dropEffect in onDragOver for IE', () => {
      const dragStartSpy = spy()
      const dragEnterSpy = spy()
      const dragLeaveSpy = spy()
      const component = mount(
        <DropLoader
          onDragStart={dragStartSpy}
          onDragEnter={dragEnterSpy}
          onDragLeave={dragLeaveSpy}
        />
      )

      // Using Proxy we'll emulate IE throwing when setting dataTransfer.dropEffect
      const eventProxy = new Proxy(
        {},
        {
          get: (target, prop) => {
            switch (prop) {
              case 'dataTransfer':
                throw new Error('IE does not support rrror')
              default:
                return function noop() {}
            }
          }
        }
      )

      // And using then we'll call the onDragOver with the proxy instead of event
      const dragOverSpy = stub(component.instance(), 'onDragOver').callsFake(
        component.instance().onDragOver(eventProxy)
      )

      component.simulate('dragStart', { dataTransfer: { items: files } })
      component.simulate('dragEnter', { dataTransfer: { items: files } })
      component.simulate('dragOver', { dataTransfer: { items: files } })
      component.simulate('dragLeave', { dataTransfer: { items: files } })
      expect(dragStartSpy.callCount).toEqual(1)
      expect(dragEnterSpy.callCount).toEqual(1)
      expect(dragLeaveSpy.callCount).toEqual(1)
      // It should not throw the error
      expect(dragOverSpy).not.toThrow()
      dragOverSpy.restore()
    })

    it('should set proper dragActive state on dragEnter', () => {
      const droploader = mount(<DropLoader>{props => <DummyChildComponent {...props} />}</DropLoader>)
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', true)
      expect(child).toHaveProp('isDragReject', false)
    })

    it('should set proper dragReject state on dragEnter', () => {
      const droploader = mount(
        <DropLoader accept="image/*">{props => <DummyChildComponent {...props} />}</DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set proper dragAccept state if multiple is false', () => {
      const droploader = mount(
        <DropLoader accept="image/*" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set proper dragAccept state if multiple is false', () => {
      const droploader = mount(
        <DropLoader accept="image/*" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', true)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should set activeClassName properly', () => {
      const droploader = mount(
        <DropLoader accept="image/*" activeClassName="👏" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragActive', true)
      expect(droploader.hasClass('👏')).toBe(true)
    })

    it('should set rejectClassName properly', () => {
      const droploader = mount(
        <DropLoader accept="image/*" rejectClassName="👎" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragReject', true)
      expect(droploader.hasClass('👎')).toBe(true)
    })

    it('should set acceptClassName properly', () => {
      const droploader = mount(
        <DropLoader accept="image/*" acceptClassName="👍" className="foo" multiple={false}>
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragAccept', true)
      expect(droploader.hasClass('👍')).toBe(true)
    })

    it('should set disabledClassName properly', () => {
      const droploader = mount(
        <DropLoader disabled disabledClassName="🤐">
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      expect(dropLoader.hasClass('🤐')).toBe(true)
    })

    it('should keep dragging active when leaving from arbitrary node', () => {
      const arbitraryOverlay = mount(<div />)
      const dropLoader = mount(<DropLoader>{props => <DummyChildComponent {...props} />}</DropLoader>)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      droploader.simulate('dragLeave', { target: arbitraryOverlay })
      expect(droploader.state('isDragActive')).toBe(true)
      expect(droploader.state('draggedFiles').length > 0).toBe(true)
    })

    it('should apply acceptStyle if multiple is false and single file', () => {
      const droploader = mount(
        <DropLoader
          accept="image/*"
          multiple={false}
          acceptStyle={acceptStyle}
          rejectStyle={rejectStyle}
        >
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      droploader.simulate('dragEnter', { dataTransfer: { files: [images[0]] } })
      const mainDiv = droploader.find('div').at(0)
      expect(mainDiv).toHaveProp('style', acceptStyle)
    })

    it('should apply rejectStyle if multiple is false and single bad file type', () => {
      const droploader = mount(
        <DropLoader
          accept="image/*"
          multiple={false}
          acceptStyle={acceptStyle}
          rejectStyle={rejectStyle}
        >
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      droploader.simulate('dragEnter', { dataTransfer: { files: [files[0]] } })
      const mainDiv = droploader.find('div').at(0)
      expect(mainDiv).toHaveProp('style', rejectStyle)
    })

    it('should apply acceptStyle + rejectStyle if multiple is false and multiple good file types', () => {
      const droploader = mount(
        <DropLoader
          accept="image/*"
          multiple={false}
          acceptStyle={acceptStyle}
          rejectStyle={rejectStyle}
        >
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      const mainDiv = droploader.find('div').at(0)
      const expectedStyle = {
        ...acceptStyle,
        ...rejectStyle
      }
      expect(mainDiv).toHaveProp('style', expectedStyle)
    })

    it('should set proper dragActive state if accept prop changes mid-drag', () => {
      const droploader = mount(
        <DropLoader accept="image/*">{props => <DummyChildComponent {...props} />}</DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', true)
      expect(child).toHaveProp('isDragReject', false)

      droploader.setProps({ accept: 'text/*' })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragAccept', false)
      expect(child).toHaveProp('isDragReject', true)
    })

    it('should expose state to children', () => {
      const droploader = mount(
        <DropLoader accept="image/*">
          {({ isDragActive, isDragAccept, isDragReject }) => {
            if (isDragReject) {
              return `${isDragActive && 'Active but'} Reject`
            }
            if (isDragAccept) {
              return `${isDragActive && 'Active and'} Accept`
            }
            return 'Empty'
          }}
        </DropLoader>
      )
      expect(droploader.text()).toEqual('Empty')
      droploader.simulate('dragEnter', { dataTransfer: { files: images } })
      expect(droploader.text()).toEqual('Active and Accept')
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      expect(droploader.text()).toEqual('Active but Reject')
    })

    it('should reset the dragAccept/dragReject state when leaving after a child goes away', () => {
      const DragActiveComponent = () => <p>Accept</p>
      const ChildComponent = () => <p>Child component content</p>
      const droploader = mount(
        <DropLoader>
          {({ isDragAccept, isDragReject }) => {
            if (isDragReject) {
              return 'Rejected'
            }
            if (isDragAccept) {
              return <DragActiveComponent isDragAccept={isDragAccept} isDragReject={isDragReject} />
            }
            return <ChildComponent isDragAccept={isDragAccept} isDragReject={isDragReject} />
          }}
        </DropLoader>
      )
      const child = droploader.find(ChildComponent)
      child.simulate('dragEnter', { dataTransfer: { files } })
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      // make sure we handle any duplicate dragEnter events that the browser may send us
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      const dragActiveChild = droploader.find(DragActiveComponent)
      expect(dragActiveChild).toBePresent()
      expect(dragActiveChild).toHaveProp('isDragAccept', true)
      expect(dragActiveChild).toHaveProp('isDragReject', false)

      droploader.simulate('dragLeave', { dataTransfer: { files } })
      expect(droploader.find(DragActiveComponent)).toBeEmpty()
      expect(child).toHaveProp('isDragAccept', false)
      expect(child).toHaveProp('isDragReject', false)
    })
  })

  describe('onDrop', () => {
    let dropSpy
    let dropAcceptedSpy
    let dropRejectedSpy

    beforeEach(() => {
      dropSpy = spy()
      dropAcceptedSpy = spy()
      dropRejectedSpy = spy()
    })

    afterEach(() => {
      dropSpy.reset()
      dropAcceptedSpy.reset()
      dropRejectedSpy.reset()
    })

    it('should reset the dragActive/dragReject state', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        >
          {props => <DummyChildComponent {...props} />}
        </DropLoader>
      )
      const child = droploader.find(DummyChildComponent)
      droploader.simulate('dragEnter', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', true)
      expect(child).toHaveProp('isDragReject', false)
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(child).toHaveProp('isDragActive', false)
      expect(child).toHaveProp('isDragReject', false)
    })

    it('should add valid files to rejected files on a multple drop when multiple false', () => {
      const droploader = mount(<DropLoader accept="image/*" onDrop={dropSpy} multiple={false} />)
      droploader.simulate('drop', { dataTransfer: { files: images } })
      const rejected = dropSpy.firstCall.args[0]
      expect(rejected.length).toEqual(1)
    })

    it('should add invalid files to rejected when multiple is false', () => {
      const droploader = mount(<DropLoader accept="image/*" onDrop={dropSpy} multiple={false} />)
      droploader.simulate('drop', {
        dataTransfer: { files: images.concat(files) }
      })
      const rejected = dropSpy.firstCall.args[1]
      expect(rejected.length).toEqual(2)
    })

    it('should allow single files to be dropped if multiple is false', () => {
      const droploader = mount(<DropLoader accept="image/*" onDrop={dropSpy} multiple={false} />)

      droploader.simulate('drop', { dataTransfer: { files: [images[0]] } })
      const [accepted, rejected] = dropSpy.firstCall.args
      expect(accepted.length).toEqual(1)
      expect(rejected.length).toEqual(0)
    })

    it('should take all dropped files if multiple is true', () => {
      const droploader = mount(<DropLoader onDrop={dropSpy} multiple />)
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[0][0].name).toEqual(images[0].name)
      expect(dropSpy.firstCall.args[0][1].name).toEqual(images[1].name)
    })

    it('should set this.isFileDialogActive to false', () => {
      const droploader = mount(<DropLoader />)
      droploader.instance().isFileDialogActive = true
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(droploader.instance().isFileDialogActive).toEqual(false)
    })

    it('should always call onDrop callback with accepted and rejected arguments', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toEqual([], [...files])
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(2)
      expect(dropSpy.lastCall.args[0]).toEqual([...images], [])
      droploader.simulate('drop', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(dropSpy.callCount).toEqual(3)
      expect(dropSpy.lastCall.args[0]).toEqual([...images], [...files])
    })

    it('should call onDropAccepted callback if some files were accepted', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropAcceptedSpy.callCount).toEqual(0)
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.lastCall.args[0]).toEqual([...images])
      droploader.simulate('drop', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(dropAcceptedSpy.callCount).toEqual(2)
      expect(dropAcceptedSpy.lastCall.args[0]).toEqual([...images])
    })

    it('should call onDropRejected callback if some files were rejected', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.lastCall.args[0]).toEqual([...files])
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropRejectedSpy.callCount).toEqual(1)
      droploader.simulate('drop', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(dropRejectedSpy.callCount).toEqual(2)
      expect(dropRejectedSpy.lastCall.args[0]).toEqual([...files])
    })

    it('applies the accept prop to the dropped files', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(1)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(1)
    })

    it('applies the accept prop to the dropped images', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )

      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts a dropped image when Firefox provides a bogus file type', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          accept="image/*"
        />
      )
      const bogusImages = [
        {
          name: 'bogus.gif',
          size: 1234,
          type: 'application/x-moz-file'
        }
      ]

      droploader.simulate('drop', { dataTransfer: { files: bogusImages } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts all dropped files and images when no accept prop is specified', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        />
      )
      droploader.simulate('drop', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('applies the maxSize prop to the dropped files', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          maxSize={1111}
        />
      )

      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(1)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('applies the maxSize prop to the dropped images', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          maxSize={1111}
        />
      )
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(2)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(2)
    })

    it('applies the minSize prop to the dropped files', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          minSize={1112}
        />
      )
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(0)
      expect(dropSpy.firstCall.args[1]).toHaveLength(1)
      expect(dropAcceptedSpy.callCount).toEqual(0)
      expect(dropRejectedSpy.callCount).toEqual(1)
      expect(dropRejectedSpy.firstCall.args[0]).toHaveLength(1)
    })

    it('applies the minSize prop to the dropped images', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
          minSize={1112}
        />
      )
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })

    it('accepts all dropped files and images when no size prop is specified', () => {
      const droploader = mount(
        <DropLoader
          onDrop={dropSpy}
          onDropAccepted={dropAcceptedSpy}
          onDropRejected={dropRejectedSpy}
        />
      )
      droploader.simulate('drop', {
        dataTransfer: { files: files.concat(images) }
      })
      expect(dropSpy.callCount).toEqual(1)
      expect(dropSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropSpy.firstCall.args[1]).toHaveLength(0)
      expect(dropAcceptedSpy.callCount).toEqual(1)
      expect(dropAcceptedSpy.firstCall.args[0]).toHaveLength(3)
      expect(dropRejectedSpy.callCount).toEqual(0)
    })
  })

  describe('preview', () => {
    it('should generate previews for non-images', () => {
      const dropSpy = spy()
      const droploader = mount(<DropLoader onDrop={dropSpy} />)
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(Object.keys(dropSpy.firstCall.args[0][0])).toContain('preview')
      expect(dropSpy.firstCall.args[0][0].preview).toContain('data://file1.pdf')
    })

    it('should generate previews for images', () => {
      const dropSpy = spy()
      const droploader = mount(<DropLoader onDrop={dropSpy} />)
      droploader.simulate('drop', { dataTransfer: { files: images } })
      expect(Object.keys(dropSpy.firstCall.args[0][0])).toContain('preview')
      expect(dropSpy.firstCall.args[0][0].preview).toContain('data://cats.gif')
    })

    it('should not throw error when preview cannot be created', () => {
      const dropSpy = spy()
      const droploader = mount(<DropLoader onDrop={dropSpy} />)

      droploader.simulate('drop', { dataTransfer: { files: ['bad_val'] } })

      expect(Object.keys(dropSpy.firstCall.args[1][0])).not.toContain('preview')
    })

    it('should not generate previews if disablePreview is true', () => {
      const dropSpy = spy()
      const droploader = mount(<DropLoader disablePreview onDrop={dropSpy} />)
      droploader.simulate('drop', { dataTransfer: { files: images } })
      droploader.simulate('drop', { dataTransfer: { files } })
      expect(dropSpy.callCount).toEqual(2)
      expect(Object.keys(dropSpy.firstCall.args[0][0])).not.toContain('preview')
      expect(Object.keys(dropSpy.lastCall.args[0][0])).not.toContain('preview')
    })
  })

  describe('onClick', () => {})

  describe('onCancel', () => {
    it('should not invoke onFileDialogCancel everytime window receives focus', done => {
      const onCancelSpy = spy()
      mount(<DropLoader id="on-cancel-example" onFileDialogCancel={onCancelSpy} />)
      // Simulated DOM event - onfocus
      document.body.addEventListener('focus', () => {})
      const evt = document.createEvent('HTMLEvents')
      evt.initEvent('focus', false, true)
      document.body.dispatchEvent(evt)
      // setTimeout to match the event callback from actual Component
      setTimeout(() => {
        expect(onCancelSpy.callCount).toEqual(0)
        done()
      }, 300)
    })

    it('should invoke onFileDialogCancel when window receives focus via cancel button', done => {
      const onCancelSpy = spy()
      const component = mount(
        <DropLoader className="droploader-content" onFileDialogCancel={onCancelSpy} />
      )

      // Test / invoke the click event
      spy(component.instance(), 'open')
      component.simulate('click')

      setTimeout(() => {
        expect(component.instance().open.callCount).toEqual(1)

        // Simulated DOM event - onfocus
        document.body.addEventListener('focus', () => {})
        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('focus', false, true)
        document.body.dispatchEvent(evt)

        // setTimeout to match the event callback from actual Component
        setTimeout(() => {
          expect(onCancelSpy.callCount).toEqual(1)
          done()
        }, 300)
      }, 0)
    })

    it('should restore isFileDialogActive to false after the FileDialog was closed', done => {
      const component = mount(<DropLoader />)

      spy(component.instance(), 'open')
      component.simulate('click')

      setTimeout(() => {
        expect(component.instance().isFileDialogActive).toEqual(true)

        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('focus', false, true)
        document.body.dispatchEvent(evt)

        setTimeout(() => {
          expect(component.instance().isFileDialogActive).toEqual(false)
          done()
        }, 300)
      }, 0)
    })
  })

  describe('nested DropLoader component behavior', () => {
    let outerDropLoader
    let innerDropLoader
    let outerDropSpy
    let outerDropAcceptedSpy
    let outerDropRejectedSpy
    let innerDropSpy
    let innerDropAcceptedSpy
    let innerDropRejectedSpy

    const InnerDragAccepted = () => <p>Accepted</p>
    const InnerDragRejected = () => <p>Rejected</p>
    const InnerDropLoader = () => (
      <DropLoader
        onDrop={innerDropSpy}
        onDropAccepted={innerDropAcceptedSpy}
        onDropRejected={innerDropRejectedSpy}
        accept="image/*"
      >
        {({ isDragActive, isDragReject }) => {
          if (isDragReject) return <InnerDragRejected />
          if (isDragActive) return <InnerDragAccepted />
          return <p>No drag</p>
        }}
      </DropLoader>
    )

    describe('dropping on the inner droploader', () => {
      it('mounts both droploaders', () => {
        outerDropSpy = spy()
        outerDropAcceptedSpy = spy()
        outerDropRejectedSpy = spy()
        innerDropSpy = spy()
        innerDropAcceptedSpy = spy()
        innerDropRejectedSpy = spy()
        outerDropLoader = mount(
          <DropLoader
            onDrop={outerDropSpy}
            onDropAccepted={outerDropAcceptedSpy}
            onDropRejected={outerDropRejectedSpy}
            accept="image/*"
          >
            {props => <InnerDropLoader {...props} />}
          </DropLoader>
        )
        innerDropLoader = outerDropLoader.find(InnerDropLoader)
      })

      it('does dragEnter on both droploaders', () => {
        innerDropLoader.simulate('dragEnter', {
          dataTransfer: { files: images }
        })
        expect(innerDropLoader).toHaveProp('isDragActive', true)
        expect(innerDropLoader).toHaveProp('isDragReject', false)
        expect(innerDropLoader.find(InnerDragAccepted).exists()).toEqual(true)
        expect(innerDropLoader.find(InnerDragRejected).exists()).toEqual(false)
      })

      it('drops on the child droploader', () => {
        innerDropLoader.simulate('drop', {
          dataTransfer: { files: files.concat(images) }
        })
      })

      it('accepts the drop on the inner droploader', () => {
        expect(innerDropSpy.callCount).toEqual(1)
        expect(innerDropSpy.firstCall.args[0]).toHaveLength(2)
        expect(innerDropSpy.firstCall.args[1]).toHaveLength(1)
        expect(innerDropAcceptedSpy.callCount).toEqual(1)
        expect(innerDropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
        expect(innerDropRejectedSpy.callCount).toEqual(1)
        expect(innerDropRejectedSpy.firstCall.args[0]).toHaveLength(1)
        expect(innerDropLoader.find(InnerDragAccepted).exists()).toEqual(false)
        expect(innerDropLoader.find(InnerDragRejected).exists()).toEqual(false)
      })

      it('also accepts the drop on the outer droploader', () => {
        expect(outerDropSpy.callCount).toEqual(1)
        expect(outerDropSpy.firstCall.args[0]).toHaveLength(2)
        expect(outerDropSpy.firstCall.args[1]).toHaveLength(1)
        expect(outerDropAcceptedSpy.callCount).toEqual(1)
        expect(outerDropAcceptedSpy.firstCall.args[0]).toHaveLength(2)
        expect(outerDropRejectedSpy.callCount).toEqual(1)
        expect(outerDropRejectedSpy.firstCall.args[0]).toHaveLength(1)
        expect(innerDropLoader).toHaveProp('isDragActive', false)
        expect(innerDropLoader).toHaveProp('isDragReject', false)
      })
    })
  })

  describe('behavior', () => {
    it('does not throw an error when html is dropped instead of files and multiple is false', () => {
      const droploader = mount(<DropLoader multiple={false} />)

      const fn = () => droploader.simulate('drop', { dataTransfer: { files: [] } })
      expect(fn).not.toThrow()
    })

    it('does not allow actions when disabled props is true', done => {
      const droploader = mount(<DropLoader disabled />)

      spy(droploader.instance(), 'open')
      droploader.simulate('click')
      setTimeout(() => {
        expect(droploader.instance().open.callCount).toEqual(0)
        done()
      }, 0)
    })

    it('when toggle disabled props, DropzLoader works as expected', done => {
      const droploader = mount(<DropLoader disabled />)
      spy(droploader.instance(), 'open')

      droploader.setProps({ disabled: false })

      droploader.simulate('click')
      setTimeout(() => {
        expect(droploader.instance().open.callCount).toEqual(1)
        done()
      }, 0)
    })
  })
})