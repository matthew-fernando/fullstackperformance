import 'dotenv/config';
import mongoose from 'mongoose';
import Outcome from './models/Outcome.js';

const abetOutcomes =
[
    { code: 'SO1', statement: 'An ability to identify, formulate, and solve complex engineering problems by applying principles of engineering, science, and mathematics.' },
    { code: 'SO2', statement: 'An ability to apply engineering design to produce solutions that meet specified needs with consideration of public health, safety, and welfare.' },
    { code: 'SO3', statement: 'An ability to communicate effectively with a range of audiences.' },
    { code: 'SO4', statement: 'An ability to recognize ethical and professional responsibilities in engineering situations.' },
    { code: 'SO5', statement: 'An ability to function effectively on a team whose members together provide leadership, create a collaborative and inclusive environment.' },
    {
        code: 'SO6',
        statement: 'An ability to develop and conduct appropriate experimentation, analyze and interpret data, and use engineering judgment to draw conclusions.',
        trees:
        [
            {
                label: 'DEVELOP',
                type: 'root',
                level: 0,
                weight: 1,
                normalized_weight: 0.2,
                threshold: 3,
                x: 0,
                y: 0,
                children:
                [
                    {
                        label: 'plan experiment',
                        type: 'keyword',
                        level: 1,
                        weight: 2,
                        normalized_weight: 0.044,
                        threshold: 0,
                        x: -200,
                        y: 150,
                        children: []
                    },
                    {
                        label: 'simulate experiment',
                        type: 'keyword',
                        level: 1,
                        weight: 4,
                        normalized_weight: 0.089,
                        threshold: 2,
                        x: 0,
                        y: 150,
                        children:
                        [
                            { label: 'using paper', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.044, threshold: 0, x: -100, y: 300, children: [] },
                            { label: 'using software', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.044, threshold: 0, x: 100, y: 300, children: [] }
                        ]
                    },
                    {
                        label: 'as a group',
                        type: 'keyword',
                        level: 1,
                        weight: 3,
                        normalized_weight: 0.067,
                        threshold: 1,
                        x: 200,
                        y: 150,
                        children:
                        [
                            { label: 'be a leader as well as a f', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.067, threshold: 0, x: 200, y: 300, children: [] }
                        ]
                    }
                ]
            },
            {
                label: 'CONDUCT',
                type: 'root',
                level: 0,
                weight: 1,
                normalized_weight: 0.2,
                threshold: 2,
                x: 500,
                y: 0,
                children:
                [
                    {
                        label: 'abide by safety protocol',
                        type: 'keyword',
                        level: 1,
                        weight: 3,
                        normalized_weight: 0.086,
                        threshold: 2,
                        x: 400,
                        y: 150,
                        children:
                        [
                            { label: 'wear safety gear', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.043, threshold: 0, x: 300, y: 300, children: [] },
                            { label: 'complete safety checklis', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.043, threshold: 0, x: 500, y: 300, children: [] }
                        ]
                    },
                    {
                        label: 'keep a log of experiment',
                        type: 'keyword',
                        level: 1,
                        weight: 4,
                        normalized_weight: 0.114,
                        threshold: 0,
                        x: 600,
                        y: 150,
                        children: []
                    }
                ]
            },
            {
                label: 'ANALYZE',
                type: 'root',
                level: 0,
                weight: 1,
                normalized_weight: 0.2,
                threshold: 2,
                x: 1000,
                y: 0,
                children:
                [
                    {
                        label: 'analyze using technolog',
                        type: 'keyword',
                        level: 1,
                        weight: 4,
                        normalized_weight: 0.114,
                        threshold: 2,
                        x: 900,
                        y: 150,
                        children:
                        [
                            { label: 'use excel', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.057, threshold: 0, x: 800, y: 300, children: [] },
                            { label: 'use python pandas', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.057, threshold: 0, x: 1000, y: 300, children: [] }
                        ]
                    },
                    {
                        label: 'show all work in submiss',
                        type: 'keyword',
                        level: 1,
                        weight: 3,
                        normalized_weight: 0.086,
                        threshold: 0,
                        x: 1100,
                        y: 150,
                        children: []
                    }
                ]
            },
            {
                label: 'JUDGMENT',
                type: 'root',
                level: 0,
                weight: 1,
                normalized_weight: 0.2,
                threshold: 2,
                x: 500,
                y: 500,
                children:
                [
                    {
                        label: 'inferences',
                        type: 'keyword',
                        level: 1,
                        weight: 2,
                        normalized_weight: 0.08,
                        threshold: 0,
                        x: 400,
                        y: 650,
                        children: []
                    },
                    {
                        label: 'using knowledge',
                        type: 'keyword',
                        level: 1,
                        weight: 3,
                        normalized_weight: 0.12,
                        threshold: 2,
                        x: 600,
                        y: 650,
                        children:
                        [
                            { label: 'from course', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.06, threshold: 0, x: 500, y: 800, children: [] },
                            { label: 'from textbook', type: 'keyword', level: 2, weight: 1, normalized_weight: 0.06, threshold: 0, x: 700, y: 800, children: [] }
                        ]
                    }
                ]
            },
            {
                label: 'CONCLUSIONS',
                type: 'root',
                level: 0,
                weight: 1,
                normalized_weight: 0.2,
                threshold: 1,
                x: 1000,
                y: 500,
                children:
                [
                    {
                        label: 'written out formally in a',
                        type: 'keyword',
                        level: 1,
                        weight: 1,
                        normalized_weight: 0.2,
                        threshold: 0,
                        x: 1000,
                        y: 650,
                        children: []
                    }
                ]
            }
        ]
    },
    { code: 'SO7', statement: 'An ability to acquire and apply new knowledge as needed, using appropriate learning strategies.' }
];

async function seed()
{
    try
    {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        await Outcome.deleteMany({});
        console.log('Cleared existing outcomes');

        await Outcome.insertMany(abetOutcomes);
        console.log('Inserted 7 ABET outcomes');

        await mongoose.disconnect();
        console.log('Done, disconnected');
    }
    catch (error)
    {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();