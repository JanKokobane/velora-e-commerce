function showKinderValidationMessage(message, type = "error") {
    const alertBox = document.getElementById("kinderAuthAlert");

    if (alertBox) {
        alertBox.textContent = message;
        alertBox.style.removeProperty("display");
        alertBox.classList.remove("error", "validation-error", "success", "validation-success");
        
        if (type === "error") {
            alertBox.classList.add("error");
        } else if (type === "success") {
            alertBox.classList.add("success");
        }
    }

    console.log(`Validation (${type}):`, message);
}

function clearKinderValidationMessage() {
    const alertBox = document.getElementById("kinderAuthAlert");

    if (alertBox) {
        alertBox.textContent = "";
        alertBox.style.display = "none";
        alertBox.classList.remove("error", "validation-error", "success", "validation-success");
    }

    // Reset all field error and success states
    document.querySelectorAll(".kinder-input-error, .kinder-input-success").forEach((input) => {
        input.classList.remove("kinder-input-error", "kinder-input-success");
    });
    document.querySelectorAll(".kinder-field-error, .kinder-field-success").forEach((group) => {
        group.classList.remove("kinder-field-error", "kinder-field-success");
    });
}

function markKinderFieldError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.add("kinder-input-error");
    inputEl.classList.remove("kinder-input-success");
    
    const group = inputEl.closest(".kinder-field-group");
    if (group) {
        group.classList.add("kinder-field-error");
        group.classList.remove("kinder-field-success");
    }
}

function markKinderFieldSuccess(inputEl) {
    if (!inputEl) return;
    inputEl.classList.add("kinder-input-success");
    inputEl.classList.remove("kinder-input-error");
    
    const group = inputEl.closest(".kinder-field-group");
    if (group) {
        group.classList.add("kinder-field-success");
        group.classList.remove("kinder-field-error");
    }
}

function validateKinderPassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

function isKinderEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.handleKinderAuthSubmit = function (event) {
    event.preventDefault();

    clearKinderValidationMessage();

    const signupTab = document.getElementById("kinderTabSignUp");
    const isSignup = signupTab && signupTab.classList.contains("active");

    const emailInput = document.getElementById("kinderEmail");
    const passwordInput = document.getElementById("kinderPassword");

    if (!emailInput || !passwordInput) {
        console.error("Email or password input could not be found.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;
    let firstErrorInput = null;

    // 1. Email Validation
    if (!email) {
        markKinderFieldError(emailInput);
        if (!hasError) {
            showKinderValidationMessage("Email address is required.", "error");
            firstErrorInput = emailInput;
            hasError = true;
        }
    } else if (!isKinderEmailValid(email)) {
        markKinderFieldError(emailInput);
        if (!hasError) {
            showKinderValidationMessage("Please enter a valid email address.", "error");
            firstErrorInput = emailInput;
            hasError = true;
        }
    } else {
        markKinderFieldSuccess(emailInput);
    }

    // 2. Password Validation
    if (!password) {
        markKinderFieldError(passwordInput);
        if (!hasError) {
            showKinderValidationMessage("Password is required.", "error");
            firstErrorInput = passwordInput;
            hasError = true;
        }
    } else if (isSignup) {
        const passwordRequirements = validateKinderPassword(password);

        if (!passwordRequirements.length) {
            markKinderFieldError(passwordInput);
            if (!hasError) {
                showKinderValidationMessage("Password must be at least 8 characters.", "error");
                firstErrorInput = passwordInput;
                hasError = true;
            }
        } else if (!passwordRequirements.uppercase) {
            markKinderFieldError(passwordInput);
            if (!hasError) {
                showKinderValidationMessage("Password must contain at least one uppercase letter.", "error");
                firstErrorInput = passwordInput;
                hasError = true;
            }
        } else if (!passwordRequirements.lowercase) {
            markKinderFieldError(passwordInput);
            if (!hasError) {
                showKinderValidationMessage("Password must contain at least one lowercase letter.", "error");
                firstErrorInput = passwordInput;
                hasError = true;
            }
        } else if (!passwordRequirements.number) {
            markKinderFieldError(passwordInput);
            if (!hasError) {
                showKinderValidationMessage("Password must contain at least one number.", "error");
                firstErrorInput = passwordInput;
                hasError = true;
            }
        } else if (!passwordRequirements.special) {
            markKinderFieldError(passwordInput);
            if (!hasError) {
                showKinderValidationMessage("Password must contain at least one special character.", "error");
                firstErrorInput = passwordInput;
                hasError = true;
            }
        } else {
            markKinderFieldSuccess(passwordInput);
        }
    } else {
        markKinderFieldSuccess(passwordInput);
    }

    // 3. Signup Specific Inputs
    if (isSignup) {
        const fullNameInput = document.getElementById("kinderFullName");
        const confirmPasswordInput = document.getElementById("kinderConfirmPassword");
        const termsInput = document.getElementById("kinderTermsCheckbox");

        if (!fullNameInput || !confirmPasswordInput || !termsInput) {
            console.error("One or more signup fields could not be found.");
            return;
        }

        const fullName = fullNameInput.value.trim();
        const confirmPassword = confirmPasswordInput.value;

        // Full Name Validation
        if (!fullName) {
            markKinderFieldError(fullNameInput);
            if (!hasError) {
                showKinderValidationMessage("Full name is required.", "error");
                firstErrorInput = fullNameInput;
                hasError = true;
            }
        } else {
            markKinderFieldSuccess(fullNameInput);
        }

        // Confirm Password Validation
        if (!confirmPassword) {
            markKinderFieldError(confirmPasswordInput);
            if (!hasError) {
                showKinderValidationMessage("Please confirm your password.", "error");
                firstErrorInput = confirmPasswordInput;
                hasError = true;
            }
        } else if (password !== confirmPassword) {
            markKinderFieldError(confirmPasswordInput);
            if (!hasError) {
                showKinderValidationMessage("Passwords do not match.", "error");
                firstErrorInput = confirmPasswordInput;
                hasError = true;
            }
        } else {
            markKinderFieldSuccess(confirmPasswordInput);
        }

        // Terms Checkbox Validation
        if (!termsInput.checked) {
            termsInput.classList.add("kinder-input-error");
            if (!hasError) {
                showKinderValidationMessage("Please select the checkbox to continue.", "error");
                firstErrorInput = termsInput;
                hasError = true;
            }
        } else {
            termsInput.classList.remove("kinder-input-error");
            termsInput.classList.add("kinder-input-success");
        }
    }

    // Focus the first invalid field if errors exist
    if (hasError) {
        if (firstErrorInput) firstErrorInput.focus();
        return;
    }

    // Form is completely valid
    if (isSignup) {
        showKinderValidationMessage("Account created successfully!", "success");
    } else {
        showKinderValidationMessage("Sign in successful! Authenticating...", "success");
    }
};