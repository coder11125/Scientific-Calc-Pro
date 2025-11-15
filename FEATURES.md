# Scientific Calculator Pro - Enhanced Features

## 🎯 New Functionality Added

### 1. **Keyboard Input Support**
- **Number keys (0-9)**: Type directly to enter numbers
- **Arithmetic operators**: `+`, `-`, `*`, `/` for basic operations
- **Decimal point**: `.` for floating-point numbers
- **Equals/Calculate**: `Enter` or `=` to compute results
- **Backspace**: Delete last character
- **Clear**: `Escape` to clear expression
- **Parentheses**: `(` and `)` for grouping operations
- **Modulo**: `%` operator
- **Power**: `^` for exponentiation

### 2. **Advanced Scientific Functions**
- **Hyperbolic Functions**: `sinh()`, `cosh()`, `tanh()`
- **Logarithm Base 2**: `log₂()` in addition to log₁₀ and natural log
- **Square Function**: `x²` (inverse of square root)
- All existing trigonometric, exponential, and power functions

### 3. **Statistics Calculator**
- **Access**: Click "Stats" button or press the stats button
- **Calculations Include**:
  - Count of numbers
  - Sum of all values
  - Mean (average)
  - Median
  - Minimum value
  - Maximum value
  - Standard deviation
  - Variance
- **Usage**: Enter comma-separated numbers (e.g., `10,20,30,40,50`)

### 4. **Calculation History**
- **Access**: Click the "⟲" button to view history
- **Features**:
  - View all previous calculations with timestamps
  - Click any calculation to load it back
  - Clear entire history with one button
  - History persists across browser sessions (stored in localStorage)
- **Auto-save**: History automatically saves when closing the page

### 5. **Enhanced Processing Power**
- **BigNumber Support**: Calculations use 64-bit precision for accuracy
- **Custom Math Functions**: Optimized implementations of:
  - Permutations (nPr)
  - Combinations (nCr)
  - Hyperbolic functions
  - Logarithm base 2
- **Better Error Handling**: Graceful error messages for invalid expressions

### 6. **Improved UI/UX**
- **New Advanced Functions Row**: Additional scientific buttons visible by default
- **Better Visual Feedback**: Smooth transitions and hover effects
- **Responsive Modals**: Statistics and History modals for organized display
- **Keyboard-friendly**: Full keyboard support for power users
- **Sound Toggle**: Persistent sound preference (stored in localStorage)

## 📊 Statistics Modal Features
The Statistics calculator supports:
- Large datasets (comma-separated)
- Real-time calculations
- Formatted results with 4 decimal precision
- Visual feedback in color-coded boxes

## 📜 History Management
- **Automatic Persistence**: Your calculation history is saved to localStorage
- **Quick Access**: Click any calculation to reload and continue from that point
- **Timestamps**: Each calculation shows when it was performed
- **Clean History**: Clear all history with one click when needed

## ⌨️ Complete Keyboard Mapping

| Key | Function |
|-----|----------|
| `0-9` | Enter digits |
| `+`, `-`, `*`, `/` | Arithmetic operations |
| `.` | Decimal point |
| `Enter`, `=` | Calculate |
| `Backspace` | Delete |
| `Escape` | Clear all |
| `(`, `)` | Parentheses |
| `%` | Modulo |
| `^` | Power |

## 🔧 Technical Enhancements
- **Math.js Integration**: Leverages math.js 12.4.2 for robust calculations
- **localStorage API**: Persists user preferences and history
- **Web Audio API**: Click sounds with toggle control
- **BigNumber Arithmetic**: 64-bit precision for scientific calculations
- **Event Delegation**: Efficient keyboard and mouse input handling

## 💾 Data Persistence
- Calculation history saves to browser's localStorage
- Sound preferences are remembered
- Data survives browser restarts (until cleared manually)

## 🎨 Visual Improvements
- New advanced functions row with additional scientific operations
- Color-coded statistics display
- Smooth modal animations
- Better responsive design for mobile devices
