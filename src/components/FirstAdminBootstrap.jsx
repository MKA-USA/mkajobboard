import { useState } from 'react'
import { supabase } from '../lib/supabase'

const FirstAdminBootstrap = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setStatus('Creating user account...')
    
    try {
      // 1. Create auth user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (signUpError) throw signUpError
      
      if (signUpData?.user) {
        setStatus('User created. Bootstrapping as admin...')
        
        // 2. Wait a moment for the auth account to propagate
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 3. Bootstrap as first admin
        const { data: adminData, error: adminError } = await supabase
          .rpc('bootstrap_first_admin', { 
            email, 
            name: name || null
          })
        
        if (adminError) throw adminError
        
        setStatus('Success! First admin created.')
        setSuccess(true)
      } else {
        throw new Error('User creation failed')
      }
    } catch (err) {
      console.error('Error creating first admin:', err)
      setError(err.message || 'Unknown error')
      setStatus('Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
        <h2 className="text-2xl font-bold mb-4 text-green-600">Success!</h2>
        <p className="mb-4">First admin account has been created successfully. You can now:</p>
        <ol className="list-decimal list-inside mb-4">
          <li className="mb-2">Log in with your credentials</li>
          <li className="mb-2">Access the admin dashboard</li>
          <li className="mb-2">Manage job postings and site settings</li>
        </ol>
        <div className="mt-4">
          <a 
            href="/admin/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Create First Admin</h2>
      <p className="mb-4 text-gray-600">
        This form will create the first admin user for the system. 
        This can only be done once when no admins exist.
      </p>
      
      {status && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p>{status}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="font-semibold text-red-700">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSignUp}>
        <div className="mb-4">
          <label htmlFor="email" className="block mb-1 font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={6}
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="name" className="block mb-1 font-medium">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Admin'}
        </button>
      </form>
    </div>
  )
}

export default FirstAdminBootstrap 