export const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Tamil",
  "Chinese",
  "Italian",
  "Russian",
] as const

export const categories = [
  "Nature",
  "Adventure",
  "Cultural",
  "Food",
  "City",
  "Cruises",
] as const

export const tourTypes = [...categories, "All tours"] as const

export const submissionStatus = ["Submitted", "Approved", "Rejected"] as const 

export const minAge = [0, 3, 13, 18] as const

export const destinationTypes = ["City", "State", "Country"] as const

export const specials = ["Free Cancellation"] as const