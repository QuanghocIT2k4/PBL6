import { createRoot } from 'react-dom/client'
import './index.css'
import 'sweetalert2/dist/sweetalert2.min.css'
import App from './App.jsx'

// ✅ TẠM TẮT STRICTMODE ĐỂ TEST - STRICTMODE GỌI FUNCTION 2 LẦN
createRoot(document.getElementById('root')).render(
  <App />
)
