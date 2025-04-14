import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...')
  const [tables, setTables] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection with a simple query
        const { data: connectionTest, error: connectionError } = await supabase
          .from('pg_catalog.pg_tables')
          .select('schemaname, tablename')
          .eq('schemaname', 'public')
          .limit(1)
        
        if (connectionError) throw connectionError
        
        setConnectionStatus(connectionTest ? 'Connected' : 'Connected, but no tables found')
        
        // Get list of tables
        const { data: tableList, error: tableError } = await supabase
          .from('pg_catalog.pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
        
        if (tableError) throw tableError
        
        setTables(tableList || [])
      } catch (err) {
        console.error('Supabase connection error:', err)
        setConnectionStatus('Connection failed')
        setError(err.message || 'Unknown error')
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <div className="mb-4">
        <p className="font-semibold">Connection Status:</p>
        <p className={`${connectionStatus === 'Connected' ? 'text-green-600' : connectionStatus === 'Checking...' ? 'text-blue-600' : 'text-red-600'}`}>
          {connectionStatus}
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="font-semibold text-red-700">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div>
        <p className="font-semibold mb-2">Public Tables:</p>
        {tables.length > 0 ? (
          <ul className="list-disc pl-5">
            {tables.map((table, index) => (
              <li key={index}>{table.tablename}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No tables found or still loading...</p>
        )}
      </div>
    </div>
  )
}

export default SupabaseTest 