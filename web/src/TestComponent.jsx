import React from 'react'

export default function TestComponent() {
  return (
    <div className="p-8 bg-blue-500 text-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Test Component</h1>
      <p className="text-lg">If you can see this with blue background and white text, React and Tailwind are working!</p>
      <button className="mt-4 px-4 py-2 bg-white text-blue-500 rounded hover:bg-gray-100 transition-colors">
        Test Button
      </button>
    </div>
  )
} 