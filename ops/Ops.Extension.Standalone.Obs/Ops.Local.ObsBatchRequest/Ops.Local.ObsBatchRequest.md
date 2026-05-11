# ObsBatchRequest

This operator allows sending multiple requests to OBS Studio in a single batch. It accumulates requests and sends them at a specified frequency (Hz).

## Inputs

- **obsConnection**: The connection object from an `ObsConnect` operator.
- **Request Rate (Hz)**: How many times per second the batch should be sent to OBS.
- **Request Object**: A JSON object representing a single OBS request (e.g., `{ "requestType": "SetInputVolume", "requestData": { "inputName": "Mic", "inputVolumeMul": 0.5 } }`). Can also be an array of requests.
- **Add to Batch**: A trigger that adds the current `Request Object` to the pending batch buffer.

## Outputs

- **Results**: An array of response objects from OBS for each request in the batch.
- **Success**: True if the batch was sent successfully.
- **Error**: Error message if the batch request failed.

## Usage

Use this operator when you need to send many updates to OBS simultaneously (e.g., moving multiple scene items or changing multiple filter parameters) without overwhelming the connection or causing synchronization issues.
