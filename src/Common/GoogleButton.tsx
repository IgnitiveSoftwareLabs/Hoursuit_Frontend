import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { googleLoginApi } from '../Services/UserApiSerice';
import { fetchcompanyapicall } from '../Services/Admin/CompanyApiService/index';


const GoogleSignInButton = () => {
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;
      // const response = await axios.post('/api/user/google-login', { token: credential });
      const response = await googleLoginApi({token: credential});

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        const companyResponse: any = await fetchcompanyapicall();
        const hasCompany =
          companyResponse.success &&
          companyResponse.result &&
          ((Array.isArray(companyResponse.result) && companyResponse.result.length > 0) ||
            (!Array.isArray(companyResponse.result) && Object.keys(companyResponse.result).length > 0));

        toast.success('Google Login Successful');
        if (hasCompany) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/companyform', { replace: true });
        }
      } else {
        toast.error('Google Login Failed');
      }
    } catch (error) {
      toast.error('Google Login Failed');
      console.error(error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="277723538870-mvibveh69ca3102o9d3e0m0tdsso88nr.apps.googleusercontent.com">
      <div style={{ display: 'flex', justifyContent: 'center'}}>
    <GoogleLogin
      onSuccess={handleGoogleLoginSuccess}
      onError={() => toast.error('Google Login Failed')}
      width={200}
      logo_alignment="left"
      
    />
    </div>
       
</GoogleOAuthProvider>
  );
};

export default GoogleSignInButton;