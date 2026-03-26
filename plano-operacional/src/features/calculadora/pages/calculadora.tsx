import { useState, FC } from 'react'

export const CalculadoraPage: FC = () => {
  const [display, setDisplay] = useState<string>('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false)

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operator) {
      const currentValue = previousValue || 0
      let result = 0

      switch (operator) {
        case '+':
          result = currentValue + inputValue
          break
        case '-':
          result = currentValue - inputValue
          break
        case '*':
          result = currentValue * inputValue
          break
        case '/':
          result = currentValue / inputValue
          break
        default:
          result = inputValue
      }

      setDisplay(String(result))
      setPreviousValue(result)
    }

    setWaitingForOperand(true)
    setOperator(nextOperator)
  }

  const calculateResult = () => {
    if (!operator || previousValue === null) return

    const inputValue = parseFloat(display)
    let result = 0

    switch (operator) {
      case '+':
        result = previousValue + inputValue
        break
      case '-':
        result = previousValue - inputValue
        break
      case '*':
        result = previousValue * inputValue
        break
      case '/':
        result = previousValue / inputValue
        break
      case '^':
        result = Math.pow(previousValue, inputValue)
        break
    }

    setDisplay(String(result))
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  const performScientificOperation = (op: string) => {
    const inputValue = parseFloat(display)
    let result = 0

    switch (op) {
      case 'sin':
        result = Math.sin(inputValue * (Math.PI / 180))
        break
      case 'cos':
        result = Math.cos(inputValue * (Math.PI / 180))
        break
      case 'tan':
        result = Math.tan(inputValue * (Math.PI / 180))
        break
      case 'log':
        result = Math.log10(inputValue)
        break
      case 'ln':
        result = Math.log(inputValue)
        break
      case 'sqrt':
        result = Math.sqrt(inputValue)
        break
      case 'square':
        result = inputValue * inputValue
        break
      case 'pi':
        result = Math.PI
        break
      case 'e':
        result = Math.E
        break
      case '^':
        performOperation('^')
        return
      default:
        return
    }

    setDisplay(String(result))
    setWaitingForOperand(true)
  }

  const toggleSign = () => {
    const value = parseFloat(display)
    setDisplay(String(value * -1))
  }

  const percentage = () => {
    const value = parseFloat(display)
    setDisplay(String(value / 100))
  }

  const btnClass = 'p-4 text-lg font-semibold rounded transition-all duration-150 active:scale-95 focus:outline-none'
  const btnNumber = `${btnClass} bg-gray-700 hover:bg-gray-600 text-white`
  const btnOperator = `${btnClass} bg-orange-500 hover:bg-orange-400 text-white`
  const btnScientific = `${btnClass} bg-gray-600 hover:bg-gray-500 text-blue-300`
  const btnClear = `${btnClass} bg-red-600 hover:bg-red-500 text-white`

  return (
    <div className="flex items-center justify-center p-4 h-full">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-6 w-full max-w-sm">
        {/* Display */}
        <div className="bg-gray-900 text-white text-right p-4 rounded-lg mb-4 min-h-[80px] flex flex-col justify-center overflow-hidden">
          <div className="text-xs text-gray-400 h-4">
            {previousValue !== null ? `${previousValue} ${operator}` : ''}
          </div>
          <div className="text-4xl font-mono truncate">
            {display}
          </div>
        </div>

        {/* Botões Científicos */}
        <div className="grid grid-cols-5 gap-2 mb-2">
          <button onClick={() => performScientificOperation('sin')} className={btnScientific}>sin</button>
          <button onClick={() => performScientificOperation('cos')} className={btnScientific}>cos</button>
          <button onClick={() => performScientificOperation('tan')} className={btnScientific}>tan</button>
          <button onClick={() => performScientificOperation('log')} className={btnScientific}>log</button>
          <button onClick={() => performScientificOperation('ln')} className={btnScientific}>ln</button>

          <button onClick={() => performScientificOperation('^')} className={btnScientific}>x&#x02B8;</button>
          <button onClick={() => performScientificOperation('square')} className={btnScientific}>x²</button>
          <button onClick={() => performScientificOperation('sqrt')} className={btnScientific}>√</button>
          <button onClick={() => performScientificOperation('pi')} className={btnScientific}>π</button>
          <button onClick={() => performScientificOperation('e')} className={btnScientific}>e</button>
        </div>

        {/* Botões Principais */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className={btnClear}>AC</button>
          <button onClick={toggleSign} className={btnNumber}>+/-</button>
          <button onClick={percentage} className={btnNumber}>%</button>
          <button onClick={() => performOperation('/')} className={btnOperator}>÷</button>

          <button onClick={() => inputDigit('7')} className={btnNumber}>7</button>
          <button onClick={() => inputDigit('8')} className={btnNumber}>8</button>
          <button onClick={() => inputDigit('9')} className={btnNumber}>9</button>
          <button onClick={() => performOperation('*')} className={btnOperator}>×</button>

          <button onClick={() => inputDigit('4')} className={btnNumber}>4</button>
          <button onClick={() => inputDigit('5')} className={btnNumber}>5</button>
          <button onClick={() => inputDigit('6')} className={btnNumber}>6</button>
          <button onClick={() => performOperation('-')} className={btnOperator}>−</button>

          <button onClick={() => inputDigit('1')} className={btnNumber}>1</button>
          <button onClick={() => inputDigit('2')} className={btnNumber}>2</button>
          <button onClick={() => inputDigit('3')} className={btnNumber}>3</button>
          <button onClick={() => performOperation('+')} className={btnOperator}>+</button>

          <button onClick={() => inputDigit('0')} className={`${btnNumber} col-span-2`}>0</button>
          <button onClick={inputDot} className={btnNumber}>.</button>
          <button onClick={calculateResult} className={btnOperator}>=</button>
        </div>
      </div>
    </div>
  )
}
