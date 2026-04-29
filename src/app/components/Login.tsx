import { useState } from 'react';
import loginImage from '../../imports/CoHive_Logo_witthBird.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { DatabricksOAuthLogin } from './DatabricksOAuthLogin';
import { WorkspaceSelector } from './WorkspaceSelector';
import { hexagon } from '../../styles/cohive-theme';

interface LoginProps {
  onLogin: (email: string) => void;
}

interface Workspace {
  workspaceHost: string;
  clientName: string;
  displayName: string;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showLoginInput, setShowLoginInput] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatabricksAuth, setShowDatabricksAuth] = useState(false);
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    // Step 1: Validate email format
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    // Step 2: Check if special help email (bypasses Databricks - mock mode)
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === 'help@cohive.com') {
      console.log('✅ Help account - mock mode enabled, bypassing Databricks auth');
      localStorage.setItem('cohive_pending_email', normalizedEmail);
      localStorage.setItem('cohive_logged_in', 'true');
      setIsLoading(false);
      onLogin(normalizedEmail);
      return;
    }

    // Step 3: Check email domain is allowed (production mode)
    try {
      const emailDomain = normalizedEmail.split('@')[1];
      
      // Step 4a: Check if user is from CoHiveSolutions - they get to choose workspace
      if (emailDomain === 'cohivesolutions.com') {
        console.log('🏢 CoHive Solutions user - fetching all workspaces');
        
        // Fetch all available workspaces
        const response = await fetch('/api/databricks/workspaces/list', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          setError('Unable to load workspaces. Please try again.');
          setIsLoading(false);
          return;
        }

        const { workspaces } = await response.json();
        
        // Transform workspaces to include display name
        const formattedWorkspaces: Workspace[] = workspaces.map((ws: any) => ({
          workspaceHost: ws.workspaceHost,
          clientName: ws.clientName,
          displayName: ws.clientName.replace(/\s+/g, '') // Remove spaces for display
        }));

        // Store email for use in OAuth flow
        localStorage.setItem('cohive_pending_email', normalizedEmail);

        // If there is only one workspace, skip the selector and connect directly
        if (formattedWorkspaces.length <= 1) {
          const ws = formattedWorkspaces[0];
          if (ws) {
            setSelectedWorkspace(ws);
            setAvailableWorkspaces(formattedWorkspaces);
            setShowLoginInput(false);
            setShowDatabricksAuth(true);
          } else {
            setError('No workspace configured. Please contact support.');
          }
          setIsLoading(false);
          return;
        }

        setAvailableWorkspaces(formattedWorkspaces);
        
        // Show workspace selector (only reached when multiple workspaces exist)
        setShowLoginInput(false);
        setShowWorkspaceSelector(true);
        setIsLoading(false);
        return;
      }

      // Step 4b: For all other domains, do normal workspace lookup
      const response = await fetch('/api/databricks/workspace-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Email domain not authorized.');
        setIsLoading(false);
        return;
      }

      const { workspaceHost, clientName } = await response.json();
      
      // Create a single workspace object for OAuth
      const workspace: Workspace = {
        workspaceHost,
        clientName,
        displayName: clientName.replace(/\s+/g, '')
      };
      
      setSelectedWorkspace(workspace);

      // Store email for use in OAuth flow
      localStorage.setItem('cohive_pending_email', normalizedEmail);

      // Show Databricks OAuth modal instead of proceeding to app
      setShowLoginInput(false);
      setShowDatabricksAuth(true);

    } catch (err) {
      setError('Unable to verify email. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowDatabricksAuth(false);
    setShowWorkspaceSelector(false);
    setShowLoginInput(true);
    setEmail('');
    setError('');
  };

  const handleWorkspaceSelected = (workspace: Workspace) => {
    console.log('✅ Workspace selected:', workspace.displayName);
    setSelectedWorkspace(workspace);
    setShowWorkspaceSelector(false);
    setShowDatabricksAuth(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-2 sm:p-4 relative">
      {/* Login Section - Top Right */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50">
        {!showLoginInput ? (
          <button
            onClick={() => setShowLoginInput(true)}
            className="group cursor-pointer transition-all hover:scale-105 relative"
            style={{ width: '60px', height: '52px' }}
          >
            <div className="relative w-full h-full sm:w-[80px] sm:h-[70px]">
              <svg
                viewBox="0 0 200 165"
                className="w-full h-full transition-all duration-200"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }}
              >
                <defs>
                  <filter id="innerShadow-login" x="-50%" y="-50%" width="200%" height="200%">
                    <feOffset in="SourceAlpha" dx="0" dy="2" result="offsetBlur"/>
                    <feFlood floodColor="#000000" floodOpacity="0.15" result="offsetColor"/>
                    <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
                    <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
                  </filter>
                  <linearGradient id="highlight-login" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.2 }} />
                    <stop offset="30%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <polygon points={hexagon.points} fill="white" stroke="#9333ea" strokeWidth="9" filter="url(#innerShadow-login)" />
                <polygon points="45,5 155,5 149,11 51,11" fill="rgba(255,255,255,0.3)" stroke="none" />
                <polygon points="155,5 195,82.5 189,82.5 149,11" fill="rgba(255,255,255,0.2)" stroke="none" />
                <polygon points="195,82.5 155,160 149,154 189,82.5" fill="rgba(0,0,0,0.1)" stroke="none" />
                <polygon points="155,160 45,160 51,154 149,154" fill="rgba(0,0,0,0.12)" stroke="none" />
                <polygon points="45,160 5,82.5 11,82.5 51,154" fill="rgba(0,0,0,0.1)" stroke="none" />
                <polygon points="5,82.5 45,5 51,11 11,82.5" fill="rgba(255,255,255,0.2)" stroke="none" />
                <polygon points={hexagon.points} fill="url(#highlight-login)" stroke="none" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-black text-center font-bold text-sm sm:text-lg">Login</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-xl border-2 border-purple-600 w-[calc(100vw-24px)] max-w-[280px]">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="you@yourcompany.com"
                autoFocus
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm"
              />
              {error && <p className="text-red-600 text-xs sm:text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 sm:px-4 rounded transition-colors disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Checking...' : 'Submit'}
                </button>
                <button
                  onClick={() => { setShowLoginInput(false); setEmail(''); setError(''); }}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* rest of your existing Login JSX below here - logo, text, privacy policy modal */}
      <div className="flex flex-col items-center justify-center -mt-12 sm:-mt-18 gap-0 w-full max-w-7xl mx-auto px-2 sm:px-4">
        <img src={loginImage} alt="CoHive - Insight into Inspiration" className="max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-full h-auto mb-[-30px] sm:mb-[-50px] z-0" />
        <div className="flex flex-col items-center z-10 relative px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[68px] leading-tight text-black text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Collaborative Marketing Intelligence
          </h1>
          <div className="flex flex-col items-center w-full">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-[34px] leading-tight text-black text-center w-full mt-2" style={{ fontFamily: 'Poppins, sans-serif', fontStyle: 'italic' }}>
              Human Creativity with AI Insights for Precision Decision-Making
            </p>
            <div className="mt-6 sm:mt-8 text-center w-full" style={{ fontFamily: 'Lato, sans-serif' }}>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-gray-800 pb-4">
                CoHive℠ is a human-led AI tool and enterprise solution that sparks human creativity for advertising and marketing teams. By leveraging collaborative intelligence and proprietary research, our agile and secure AI platform delivers superior insights and creative solutions for precision marketing decisions. You become the AI expert, driving innovation and growth through optimal consumer connection.
              </p>
              <div className="mt-8 sm:mt-12 text-xs sm:text-sm text-gray-600 space-y-2">
                <p className="break-words">CoHive, Inc. | PO Box 697 | Copake, NY 12516 | info@CoHiveSolutions.com</p>
                <div className="flex justify-center">
                  <button onClick={() => setShowPrivacyPolicy(true)} className="text-purple-600 hover:text-purple-700 underline">Privacy Policy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal - keep your existing one here */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>Website Privacy Policy</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">Last updated: March 1, 2026</DialogDescription>
          </DialogHeader>
         <div className="prose prose-sm max-w-none space-y-4 text-gray-700" style={{ fontFamily: 'Lato, sans-serif' }}>
            <p>
              At CoHive, we believe that your privacy is a fundamental right. We are committed to protecting your privacy when visiting our website. Our business model is built on providing value without collecting or compromising your personal information. This Privacy Policy explains our practices and how we handle—or rather, do not handle—your data. We do not collect, store, process, or share any personal data—ever.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>No Data Collection</h2>
            <p>We do not collect, store, or process any personal data. This includes, but is not limited to:</p>
            <p>
              <strong>Personal Information/Identifiers:</strong> We do not collect your name, email address, physical address, mailing address, or phone number, account information, or any other personal information.
            </p>
            <p>
              <strong>Analytics:</strong> We do not use tracking pixels, cookies, third-party analytics (like Google Analytics), or any other usage data, analytics, or tracking technologies.
            </p>
            <p>
              <strong>Device Info:</strong> We do not log your IP address, browser type/information, location data, or hardware identifiers, or any other data that could identify you or your activity.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>No Tracking</h2>
            <p>
              We do not follow your activity across the web. Our website does not use "cookies," tracking pixels, analytics scripts, or any other technologies designed to monitor or identify users, or track your behavior, or remember your preferences between sessions.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>No Use or Sharing of Your Information</h2>
            <p>
              Because we do not collect any information, we do not use your information for any purpose. Therefore, we cannot and do not share any information with third parties because we do not collect any information in the first place.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>No Data Storage and Security</h2>
            <p>
              Since we do not collect or store any data, no personal information is ever stored on our servers. As a result, there is no risk of your personal data being accessed, leaked, or misused.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Third-Party Services</h2>
            <p>
              If we use a third-party service provider (such as a web-hosting platform), we select partners who adhere to strict privacy standards. While these providers may generate temporary technical logs for security and performance, CoHive does not have access to this data, nor do we request it.
            </p>
            <p>
              If you navigate to third‑party websites or services through links on our site, those services may have their own privacy practices. We encourage you to review their privacy policies. We do not control or interact with any third‑party data collection.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Children's Privacy</h2>
            <p>
              Since we do not collect any information from any users, we naturally do not collect personal information from children under the age of 13.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Changes to This Policy</h2>
            <p>
              CoHive may update this policy occasionally to reflect changes in our services, practices, or changes in privacy policy laws. However, our commitment to "zero-data" collection will remain a core principle of our company.
            </p>
            <p>Any updates will be posted on this page with a revised effective date.</p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Policies for CoHive Platform Users</h2>
            <p>
              This website privacy policy governs exclusively the privacy practices for visitors to the public CoHive website. For users who proceed to log in and use our AI-powered tools, a separate, comprehensive set of policies is in effect. Policies for CoHive Platform Users are outlined in each company contract to clarify that our AI-powered tools are deployed and used on your company's own data and content platforms. To keep your proprietary data and intellectual property safe, our application is designed to live entirely within your secure environment. Your company retains 100% ownership of all data, and we maintain a "Zero Access" policy, meaning we cannot view or extract your sensitive information. We use industry-standard encryption to protect your work, and our terms strictly prohibit third-party sharing or data mining, ensuring all company proprietary data, content, and intellectual property remain exclusively your company's property and are protected by your company's existing privacy and use policies. Essentially, your data stays yours, and our role is simply to provide a secure, powerful tool that respects the boundaries of your infrastructure.
            </p>

            <h2 className="text-xl font-bold text-black mt-6 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="font-semibold">info@cohivesolutions.com</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Databricks OAuth Modal - cannot be dismissed */}
      <DatabricksOAuthLogin 
        open={showDatabricksAuth} 
        onClose={handleBackToLogin}
        onBackToLogin={handleBackToLogin}
        selectedWorkspace={selectedWorkspace}
      />

      {/* Workspace Selector Modal */}
      <WorkspaceSelector
        open={showWorkspaceSelector}
        onClose={() => setShowWorkspaceSelector(false)}
        availableWorkspaces={availableWorkspaces}
        selectedWorkspace={selectedWorkspace}
        setSelectedWorkspace={setSelectedWorkspace}
        onWorkspaceSelected={handleWorkspaceSelected}
      />
    </div>
  );
}