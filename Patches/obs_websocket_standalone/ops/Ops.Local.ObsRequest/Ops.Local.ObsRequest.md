# ObsRequest

Sends a request to the connected OBS instance.

## Parameters

- **obsConnection**: The connection object from the **ObsConnect** operator.
- **Request Type**: The name of the request (e.g., `SetCurrentProgramScene`).
- **Request Data**: An object containing the request parameters.
- **Send Request**: Trigger to execute the request.

## Outputs

- **Success**: Boolean indicating if the request was successful.
- **Result**: The data returned by OBS in response to the request.
- **Error**: String containing error messages if the request fails.
