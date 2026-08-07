export interface loginauth {
  [x: string]: any;
  Email: string;
  Password: string;
}

export interface registerauth {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  Phone: string;
}

export interface forgetPassword {
  Email: string;
}
