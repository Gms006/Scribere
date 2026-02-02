import { useEffect } from 'react'

type ToastProps = {
  message: string
  onClose: () => void
}

const Toast = ({ message, onClose }: ToastProps) => {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 2000)
    return () => window.clearTimeout(timeout)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink-700 shadow-lg">
      {message}
    </div>
  )
}

export default Toast
