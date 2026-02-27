export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['@swc/jest', {
            jsc: {
                target: 'es2020',
                parser: { syntax: 'typescript', tsx: false }
            },
            module: { type: 'es6' }
        }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    extensionsToTreatAsEsm: ['.ts'],
    testMatch: ['**/tests/**/*.test.ts'],
};
