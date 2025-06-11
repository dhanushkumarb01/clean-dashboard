import React from 'react';

const ContactsList = ({ contacts = [] }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'Unknown';
    
    // If it's a long number, format it nicely
    if (phoneNumber.length > 10) {
      const country = phoneNumber.substring(0, phoneNumber.length - 10);
      const number = phoneNumber.substring(phoneNumber.length - 10);
      const area = number.substring(0, 3);
      const first = number.substring(3, 6);
      const second = number.substring(6);
      return `${country} ${area}-${first}-${second}`;
    }
    
    return phoneNumber;
  };

  const getInitials = (name, phoneNumber) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (phoneNumber) {
      return phoneNumber.substring(-2).toUpperCase();
    }
    return '??';
  };

  const getContactDisplayName = (contact) => {
    return contact.contactName || formatPhoneNumber(contact._id) || 'Unknown Contact';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Active Contacts</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No contacts yet</p>
            <p className="text-gray-400 text-xs mt-1">Contacts will appear here once you start messaging</p>
          </div>
        ) : (
          contacts.map((contact, index) => (
            <div key={contact._id || index} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {getInitials(contact.contactName, contact._id)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getContactDisplayName(contact)}
                    </p>
                    <div className="flex items-center space-x-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {contact.messageCount} msg{contact.messageCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 truncate">
                      {formatPhoneNumber(contact._id)}
                    </p>
                    {contact.lastMessage && (
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(contact.lastMessage)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {contacts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing top {contacts.length} contacts by message count
          </p>
        </div>
      )}
    </div>
  );
};

export default ContactsList;
