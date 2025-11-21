import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Login/> },
  { path: '/login', element: <Login/> },
  { path: '/register', element: <Register/> },
  { path: '/dashboard', element: <Dashboard/> },
])

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode desactivado temporalmente para evitar doble renderizado con túneles lentos
  // <React.StrictMode>
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  // </React.StrictMode>
)
