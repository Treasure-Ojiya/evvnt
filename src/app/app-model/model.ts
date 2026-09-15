export interface RegModel {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface RegResult {
  email: string;
  first_name: string;
  last_name: string;
  uuid: string;
  created_at: string;
  role: string;
}

export interface LoginModel {
  email: string;
  password: string;
}

export interface LoginResult {
  status: string;
  message: string;
  access_token: string;
  token_type: string;
}

export interface UserModel {
  uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export interface UserResult {
  status: string;
  message: string;
}

export interface ForgotPasswordModel {
  email: string;
}

export interface ForgotPasswordResult {
  status: string;
  message: string;
  reset_token: string;
}

export interface ResetPasswordModel {
  token: string;
  new_password: string;
}

export interface ResetPasswordResult {
  status: string;
  message: string;
}
