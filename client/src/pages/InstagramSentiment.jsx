import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, MessageSquare, ThumbsUp, AlertCircle, ArrowLeft } from 'lucide-react';

const InstagramSentiment = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Instagram Sentiment Analysis</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Messages Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">1,248</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Positive Sentiment Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Positive</p>
              <p className="text-2xl font-bold text-green-600">856</p>
              <p className="text-xs text-green-600">+12% from last week</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Negative Sentiment Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Negative</p>
              <p className="text-2xl font-bold text-red-600">128</p>
              <p className="text-xs text-red-600">-4% from last week</p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Overall Sentiment Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sentiment Score</p>
              <p className="text-2xl font-bold text-indigo-600">82%</p>
              <p className="text-xs text-gray-500">Overall positive</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <BarChart2 className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Sentiment Analysis</h2>
        <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Sentiment analysis chart will be displayed here</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Positive Comments</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">"This product changed my life! So happy with the results."</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>@happycustomer</span>
                  <span className="mx-2">•</span>
                  <span>2 days ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Negative Comments</h2>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {i === 1 
                    ? "Very disappointed with the quality. Not what I expected at all."
                    : "Customer service was unhelpful and rude. Will not buy again."
                  }
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>@{i === 1 ? 'disappointed_user' : 'angry_customer'}</span>
                  <span className="mx-2">•</span>
                  <span>{i === 1 ? '1 week ago' : '3 days ago'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramSentiment;
