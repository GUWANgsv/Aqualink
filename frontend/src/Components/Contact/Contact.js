import React, { useState } from 'react';
import UniversalNavbar from '../Nav/UniversalNavbar';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100">
      {/* Universal Navbar */}
      <UniversalNavbar />

      {/* Main Content with top padding for fixed navbar */}
      <div className="pt-16">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-teal-600 to-coral-600 text-white">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl md:text-2xl opacity-90">Get in touch with our team</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-8">Get In Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-3 rounded-full border border-teal-200">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Head Office</h3>
                  <p className="text-slate-600">123 Water Street, Aqua City</p>
                  <p className="text-slate-600">Clean Water District, CW 12345</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-3 rounded-full border border-teal-200">
                  <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Phone</h3>
                  <p className="text-slate-600">Main: +1 (555) 123-4567</p>
                  <p className="text-slate-600">Emergency: +1 (555) 999-8888</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-3 rounded-full border border-teal-200">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Email</h3>
                  <p className="text-slate-600">info@aqualink.com</p>
                  <p className="text-slate-600">support@aqualink.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-3 rounded-full border border-teal-200">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Business Hours</h3>
                  <p className="text-slate-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-slate-600">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-slate-600">Sunday: Closed (Emergency service available)</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-8 bg-gradient-to-br from-coral-50 to-amber-50 border border-coral-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-coral-100 p-2 rounded-full">
                  <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-coral-800">Emergency Contact</h3>
              </div>
              <p className="text-coral-700 mb-2">For emergency water supply needs:</p>
              <p className="text-coral-700 font-semibold">Emergency Hotline: +1 (555) 999-8888</p>
              <p className="text-coral-700 text-sm">Available 24/7 for fire brigades and critical situations</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 rounded-lg shadow-lg p-8 border border-teal-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Information</option>
                  <option value="support">Technical Support</option>
                  <option value="emergency">Emergency Water Supply</option>
                  <option value="recycling">Recycling Services</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please describe your inquiry or request..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-coral-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-teal-600 hover:to-coral-600 transition duration-300"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">Find Our Branches</h2>
          <div className="bg-gradient-to-br from-teal-100 to-coral-100 rounded-lg h-96 flex items-center justify-center border border-teal-200">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-slate-600 text-lg">Interactive Map Coming Soon</p>
              <p className="text-slate-500">We're working on integrating a real-time map to show all our branch locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">How do I place an order?</h3>
              <p className="text-slate-600">
                You can place orders through our website, by calling our customer service, 
                or visiting any of our branch locations.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">What are your delivery times?</h3>
              <p className="text-slate-600">
                Standard delivery is within 24-48 hours. Emergency deliveries are available 
                for urgent situations with special arrangements.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Do you offer recycling services?</h3>
              <p className="text-slate-600">
                Yes! We have comprehensive recycling programs for water bottles and containers. 
                Contact us to learn more about our recycling initiatives.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-teal-100 to-coral-100 p-6 rounded-lg shadow-md border border-teal-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">How can I report an emergency?</h3>
              <p className="text-slate-600">
                For emergency water supply needs, call our 24/7 emergency hotline: 
                +1 (555) 999-8888. This service is specifically for fire brigades and critical situations.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Contact;
