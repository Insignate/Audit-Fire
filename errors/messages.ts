export function permissionException(message: string){
  return "Permission Error: " + message
}

export function dataInputException(message: string){
  return "Data Input Exception: " + message
}

export function dbDataInsertException(message: string){
  return "Database Date Insertion Exception: " + message
}

export function loginException(message: string){
  return "Login Exception" + message
}

export const psqlErrorException = (errorNumber: string, composedMessage: string) => {
  switch(errorNumber){
    case "23505": return {error: composedMessage};
    case "23503": return {error: "Please make sure all the required fields are filed"};
    case "22001": return {error: "The string legth is greater than the server specification"};
    default: return {error: "No Info for code: " + errorNumber};
  }
}