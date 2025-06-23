import React, { useState, useEffect } from 'react';
import { whatsapp } from '../utils/api';

const WhatsAppMessagesList = () => {
  const [categories, setCategories] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await whatsapp.getMessageAnalysis();
      setCategories(data.categories || {});
      setStats(data.stats || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Message Content Analysis (WhatsApp)</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Message Content Analysis (WhatsApp)</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
          <button onClick={loadAnalysis} className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded">Retry</button>
        </div>
      </div>
    );
  }

  const renderMessage = (msg) => (
    <div key={msg._id || msg.messageId} className={`border rounded-lg p-4 ${msg.isFlagged ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-sm font-medium text-gray-900">From: {msg.from}</span>
            <span className="text-xs text-gray-500">To: {msg.to}</span>
            <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</span>
          </div>
          <div className="mb-3">
            <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
          </div>
          {msg.suspiciousKeywords && msg.suspiciousKeywords.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-red-600 font-medium">Suspicious keywords: </span>
              {msg.suspiciousKeywords.map((keyword, idx) => (
                <span key={idx} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-1">{keyword}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${msg.riskScore >= 7 ? 'text-red-600 bg-red-100' : msg.riskScore >= 4 ? 'text-yellow-600 bg-yellow-100' : 'text-green-600 bg-green-100'}`}>
            {msg.riskScore >= 7 ? 'High Risk' : msg.riskScore >= 4 ? 'Medium Risk' : 'Low Risk'} ({msg.riskScore}/10)
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">💬 Message Content Analysis (WhatsApp)</h3>
        <button onClick={loadAnalysis} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1 rounded-md">🔄 Refresh</button>
      </div>
      {categories.fraud && categories.fraud.length === 0 && categories.safe && categories.safe.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg font-medium">No Messages Found</p>
          <p className="text-sm mt-2">No WhatsApp messages available for analysis.</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <span className="font-semibold">Fraudulent/Risky Messages:</span>
            <div className="space-y-2 mt-2">
              {(categories.fraud || []).map(renderMessage)}
            </div>
          </div>
          <div className="mb-4">
            <span className="font-semibold">Safe Messages:</span>
            <div className="space-y-2 mt-2">
              {(categories.safe || []).map(renderMessage)}
            </div>
          </div>
          <div className="mb-4">
            <span className="font-semibold">Sensitive Content:</span>
            <div className="space-y-2 mt-2">
              {(categories.sensitive || []).map(renderMessage)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WhatsAppMessagesList; 