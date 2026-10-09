import { Component } from 'manate/react/class-components'
import { refsStatic, refs } from '../common/ref'
import SuggestionItem from './cmd-item'
import classnames from 'classnames'

export default class TerminalCmdSuggestions extends Component {
  state = {
    cursorPosition: {},
    showSuggestions: false,
    cmdIsDescription: false,
    reverse: false,
    cmd: '',
    passwordMode: false
  }

  componentDidMount () {
    refsStatic.add('terminal-suggestions', this)
  }

  componentWillUnmount () {
    refsStatic.remove('terminal-suggestions')
  }

  openSuggestions = (cursorPosition, cmd) => {
    if (this.state.passwordMode) {
      return
    }
    if (!this.state.showSuggestions) {
      document.addEventListener('click', this.handleClickOutside)
      document.addEventListener('keydown', this.handleKeyDown)
    }

    const {
      left,
      top,
      cellHeight
    } = cursorPosition
    const w = window.innerWidth
    const h = window.innerHeight

    const position = {}
    const reverse = top > h / 2

    // Use right position if close to right edge
    if (left > w / 2) {
      position.right = w - left
    } else {
      position.left = left
    }

    // Use bottom position if close to bottom edge
    if (reverse) {
      position.bottom = h - top + cellHeight * 1.5
    } else {
      position.top = top + cellHeight
    }
    this._suggestionsCache = null
    this.setState({
      showSuggestions: true,
      cursorPosition: position,
      cmd,
      reverse,
      passwordMode: false
    })
  }

  openPasswordSuggestions = (cursorPosition) => {
    if (!this.state.showSuggestions) {
      document.addEventListener('click', this.handleClickOutside)
      document.addEventListener('keydown', this.handleKeyDown)
    }

    const {
      left,
      top,
      cellHeight
    } = cursorPosition
    const w = window.innerWidth
    const h = window.innerHeight

    const position = {}
    const reverse = top > h / 2

    if (left > w / 2) {
      position.right = w - left
    } else {
      position.left = left
    }

    if (reverse) {
      position.bottom = h - top + cellHeight * 1.5
    } else {
      position.top = top + cellHeight
    }
    this.setState({
      showSuggestions: true,
      cursorPosition: position,
      cmd: '',
      reverse,
      passwordMode: true
    })
  }

  closeSuggestions = () => {
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('keydown', this.handleKeyDown)
    this._suggestionsCache = null
    this.setState({
      showSuggestions: false,
      passwordMode: false
    })
  }

  handleClickOutside = (event) => {
    const suggestionElement = document.querySelector('.terminal-suggestions-wrap')
    if (suggestionElement && !suggestionElement.contains(event.target)) {
      this.closeSuggestions()
    }
  }

  handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      this.closeSuggestions()
    }
  }

  handleDelete = (item) => {
    window.store.deleteCmdHistory(item.command)
  }

  handleSelect = (item) => {
    const { activeTabId } = window.store
    const terminal = refs.get('term-' + activeTabId)
    if (!terminal) {
      console.log('No active terminal found')
      this.closeSuggestions()
      return
    }

    if (item.type === 'PW') {
      try {
        // Send password + Enter directly, no backspace needed
        terminal.attachAddon._sendData(item.command + '\r')
        terminal.attachAddon._passwordPromptDetected = false
        terminal.attachAddon._lastOutputLine = ''
      } catch (e) {
        console.error('Failed to send password:', e)
      }
      terminal.term.focus()
      this.closeSuggestions()
      return
    }

    const { command } = item
    // Read current input from buffer directly to avoid stale state
    // (onData fires before echo, so this.state.cmd may lag behind)
    const currentInput = terminal.getCurrentInput() || ''
    let txt = ''
    if (currentInput && command.startsWith(currentInput)) {
      txt = command.slice(currentInput.length)
    } else {
      const pre = '\b'.repeat(currentInput.length)
      txt = pre + command
    }
    terminal.attachAddon._sendData(txt)
    // Update the terminal's currentInput to reflect the full command
    terminal.setCurrentInput(command)
    terminal.term.focus()
    this.closeSuggestions()
  }

  processCommands = (commands = [], type, uniqueCommands, res) => {
    const { cmd } = this.state
    commands
      .filter(command => command && command.startsWith(cmd))
      .forEach(command => {
        if (!uniqueCommands.has(command)) {
          uniqueCommands.add(command)
          res.push({
            // Use stable key to avoid React re-mounting items on every render
            id: type + ':' + command,
            command,
            type
          })
        }
      })
  }

  getPasswordSuggestions = () => {
    const bookmarks = window.store.bookmarks || []
    const seen = new Set()
    const res = []
    for (const b of bookmarks) {
      if (b.password && !seen.has(b.password)) {
        seen.add(b.password)
        res.push({
          id: 'PW:' + b.password,
          command: b.password,
          type: 'PW',
          hint: [b.username, [b.host, b.port].filter(Boolean).join(':')].filter(Boolean).join('@')
        })
      }
    }
    return this.state.reverse ? res.reverse() : res
  }

  _suggestionsCache = null
  _suggestionsCacheKey = ''

  getSuggestions = () => {
    // Memoize: only recompute when cmd, reverse or props change
    const { cmd, reverse } = this.state
    const { suggestions } = this.props
    const cacheKey = cmd + '|' + reverse + '|' + (suggestions?.history?.length || 0) + '|' + (suggestions?.batch?.length || 0) + '|' + (suggestions?.quick?.length || 0)
    if (this._suggestionsCache && this._suggestionsCacheKey === cacheKey) {
      return this._suggestionsCache
    }
    const uniqueCommands = new Set()
    const {
      history = [],
      batch = [],
      quick = []
    } = suggestions || {}
    const res = []
    this.processCommands(history, 'H', uniqueCommands, res)
    this.processCommands(batch, 'B', uniqueCommands, res)
    this.processCommands(quick, 'Q', uniqueCommands, res)
    const finalRes = reverse ? res.reverse() : res
    this._suggestionsCache = finalRes
    this._suggestionsCacheKey = cacheKey
    return finalRes
  }

  render () {
    const { showSuggestions, cursorPosition, reverse, passwordMode } = this.state
    if (!showSuggestions) {
      return null
    }
    const suggestions = passwordMode
      ? this.getPasswordSuggestions()
      : this.getSuggestions()
    const cls = classnames('terminal-suggestions-wrap', {
      reverse
    })
    return (
      <div className={cls} style={cursorPosition}>
        <div className='terminal-suggestions-list'>
          {
            suggestions.map(item => {
              return (
                <SuggestionItem
                  key={item.id}
                  item={item}
                  onSelect={this.handleSelect}
                  onDelete={this.handleDelete}
                />
              )
            })
          }
        </div>
      </div>
    )
  }
}
