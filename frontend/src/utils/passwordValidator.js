export const passwordValidator = (password) => {
    const errors = [];
    
    // Minimum length check
    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    
    // Check for number
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    
    // Check for special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}; 