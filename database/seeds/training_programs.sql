INSERT INTO training_programs (
    trainer_user_id,
    title,
    description,
    duration_weeks,
    price,
    currency,
    purchase_count,
    created_at,
    updated_at,
    program_img,
    program_link
) VALUES
(11, 'Full Body Strength', 'A comprehensive 6-week strength-building program for beginners.', 6, 49.99, 'USD', 0, NOW(), NOW(), '/pw2425/frontend/assets/programs_banner/image1.jpg', '/pw2425/frontend/assets/training_programs/programi-1.pdf'),

(11, 'HIIT Burn', 'High-Intensity Interval Training to burn fat and improve endurance.', 4, 29.99, 'EUR', 0, NOW(), NOW(), '/pw2425/frontend/assets/programs_banner/image2.jpg', '/pw2425/frontend/assets/training_programs/programi-1.pdf'),

(11, 'Powerlifting Prep', 'Geared toward intermediate lifters preparing for powerlifting competitions.', 8, 59.99, 'USD', 0, NOW(), NOW(), '/pw2425/frontend/assets/programs_banner/image2.jpg','/pw2425/frontend/assets/training_programs/programi-1.pdf'),

(11, 'Mobility Boost', 'Focus on joint health, flexibility, and mobility routines.', 3, 19.99, 'USD', 0, NOW(), NOW(), '/pw2425/frontend/assets/programs_banner/image1.jpg', '/pw2425/frontend/assets/training_programs/programi-1.pdf'),

(11, 'Lean Muscle Builder', 'Build lean muscle with a balanced 5-day split program.', 5, 44.99, 'USD', 0, NOW(), NOW(), '/pw2425/frontend/assets/programs_banner/image2.jpg', '/pw2425/frontend/assets/training_programs/programi-1.pdf');