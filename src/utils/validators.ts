import { z } from 'zod';
import { categories, languages } from '../config/tourConfig';

const sanitizeString = (value: string) => value.trim().replace(/\s+/g, ' ');

export const TourSchema = z.object({
  name: z.string()
    .transform(sanitizeString)
    .pipe(z.string().min(8, { message: 'Tour name should be minimum 8 characters' })
    .max(40, { message: 'Tour name should be maximum 40 characters' })),

  description: z.string()
    .transform(sanitizeString)
    .pipe(z.string().min(100, { message: 'Tour description should be minimum 100 characters' })
    .max(400, { message: 'Tour description should be maximum 400 characters' })),
    
  category: z.string()
    .transform(sanitizeString)
    .refine(category => categories.includes(category), {
      message: 'Category is not valid',
    }),

  highlights: z.array(z.string()
    .transform(sanitizeString)
    .pipe(z.string().min(20, { message: 'Highlight should be minimum 20 characters' })
    .max(100, { message: 'Highlight should be maximum 100 characters' })))
    .min(2, { message: 'Highlights must have at least 2 entries' })
    .max(10, { message: 'Highlights should not exceed 10 entries' }),

  city: z.string()
    .transform(sanitizeString)
    .pipe(z.string().min(2, { message: 'City name must be at least 2 characters' })
    .max(168, { message: 'City name must not exceed 168 characters' })),

  state: z.string()
    .transform(sanitizeString)
    .pipe(z.string().min(2, { message: 'State name must be at least 2 characters' })
    .max(50, { message: 'State name must not exceed 50 characters' })),

  zipCode: z.number()
    .refine(code => /^\d{7,8}$/.test(code.toString()), { message: 'Zip code must be 7 or 8 digits' }),

  price: z.number()
    .min(5, { message: 'Price should not be less than 5' })
    .max(10000, { message: 'Price should not be more than 10000' })
    .transform(value => parseFloat(value.toFixed(2))),

  itinerary: z.array(z.object({
    place: z.string()
      .transform(sanitizeString)
      .pipe(z.string().min(4, { message: 'Place must be at least 4 characters' })
      .max(50, { message: 'Place must not exceed 50 characters' })),

    description: z.string()
      .transform(sanitizeString)
      .pipe(z.string().min(10, { message: 'Description must be at least 10 characters' })
      .max(300, { message: 'Description must not exceed 300 characters' })),
  }))
    .min(2, { message: 'Itinerary must have at least 1 entry' })
    .max(10, { message: 'Itinerary should not exceed 10 entries' }),

  languages: z.array(z.string().transform(sanitizeString))
    .min(1, { message: 'At least one language must be provided' })
    .max(8, { message: 'Languages should not exceed 8 entries' })
    .refine(langArray => langArray.every(lang => languages.includes(lang)), {
      message: 'Invalid language provided',
    }),

  faq: z.array(z.object({
    question: z.string()
      .transform(sanitizeString)
      .pipe(z.string().min(8, { message: 'FAQ question must be at least 8 characters' })
      .max(100, { message: 'FAQ question must not exceed 100 characters' })),

    answer: z.string()
      .transform(sanitizeString)
      .pipe(z.string().min(2, { message: 'FAQ answer must be at least 2 characters' })
      .max(300, { message: 'FAQ answer must not exceed 300 characters' })),
  }))
    .min(1, { message: 'At least one FAQ must be provided' })
    .max(10, { message: 'FAQ should not exceed 10 entries' }),

  minAge: z.number()
    .int()
    .min(0, { message: 'Age must be at least 0' })
    .max(18, { message: 'Age must not be more than 18' }),

  freeCancellation: z.boolean().optional().default(false),
});

export type TourSchema = z.infer<typeof TourSchema>;
