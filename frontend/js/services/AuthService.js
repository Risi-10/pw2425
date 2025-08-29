class AuthService {
  //POST request per te regjistruar userin
  static async signup(firstName, lastName, email, password, role = 'client') {
    const response = await fetch('/pw2425/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  }

  //POST request per te loguar userin
  static async login(email, password) {
    const response = await fetch('/pw2425/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  static async verifyToken(token) {
    const response = await fetch('/pw2425/api/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      let errorDetails = `Status: ${response.status}`;
      try {
        const errorBody = await response.text();
        errorDetails += `, Body: ${errorBody.substring(0, 100)}`;
      } catch (_) {}
      throw new Error(`Token verification failed (${errorDetails})`);
    }

    try {
      const jsonData = await response.json();
      return jsonData;
    } catch (jsonError) {
      throw new Error('Failed to parse verification response from server.');
    }
  }

  static logout() {
    localStorage.removeItem('jwt');
  }

  //shikon nqs eshte logged in
  static isAuthenticated() {
    return !!localStorage.getItem('jwt');
  }

  //Merr rolin e userit
  static async getCurrentUserRole() {
    const token = localStorage.getItem('jwt');
    if (!token) {
      return null;
    }

    try {
      const payload = await this.verifyToken(token);

      if (payload && payload.success && payload.data && payload.data.role) {
        return payload.data.role;
      } else {
        AuthService.logout();
        return null;
      }
    } catch (error) {
      console.error('Error during token verification:', error); // Minimal error logging
      AuthService.logout();
      return null;
    }
  }

  static async updateProfile(userId, profileData) {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/pw2425/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }
    return response.json();
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/pw2425/api/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to change password');
    }
    return response.json();
  }

  static async updateProfilePicture(userId, formData) {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');

    

    const response = await fetch(
      `/pw2425/api/users/${userId}/profile-picture`,
      {
        method: 'POST', 
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type' will be set by browser to 'multipart/form-data'
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile picture');
    }
    return response.json(); // Expecting { success: true, data: { profile_picture_url: '...' } }
  }

  static async deleteAccount(userId, password) {
    const token = localStorage.getItem('jwt');
    if (!token) throw new Error('Not authenticated');

    // build a JSON text payload
    const jsonBody = JSON.stringify({ current_password: password });
    console.log('[deleteAccount] outgoing JSON:', jsonBody);

    const response = await fetch(`/pw2425/api/users/${userId}/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}`,
      },
      body: jsonBody, // MUST be JSON.stringify’d
    });

    const text = await response.text();
    console.log('[deleteAccount] raw response text:', text);
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`);
    }
    if (!data.success) {
      throw new Error(data.message || 'Account deletion failed');
    }
    return data; // { success: true, message: '…' }
  }

  static getCurrentUserRole() {

    const token = localStorage.getItem('jwt');
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return decodedPayload.role || null;
    } catch (error) {
      console.error('Error decoding token for role:', error);
      return null;
    }
  }

  static getCurrentUser() {
    const token = localStorage.getItem('jwt');
    if (!token) {
      return null;
    }
    try {
      // Decode the payload part of the JWT (the second part)
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.warn('Invalid JWT structure: Missing payload.');
        return null;
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);

      // Check for expiration (important for client-side check)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn('JWT has expired. Logging out.');
        this.logout(); // Use static context if calling static method
        return null;
      }

      if (decoded && decoded.user_id && decoded.role) {
        return { id: decoded.user_id, role: decoded.role };
      }
      console.warn('Decoded JWT payload does not contain user_id or role.');
      return null;
    } catch (error) {
      console.error('Error decoding JWT for getCurrentUser:', error);
      return null;
    }
  }
}

export default AuthService;
