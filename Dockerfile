FROM node:20-alpine AS base
COPY . /app

WORKDIR /app
RUN apk add --no-cache postgresql-client
RUN npm install

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

# Build the application
RUN npm run build

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "start"] 