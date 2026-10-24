# DevHub SaltStack Integration

## Purpose
Use SaltStack in masterless mode to manage and validate a non-secret DevHub
operational configuration file.

## Structure
- `top.sls`: Salt state mapping
- `states/devhub.sls`: configuration management and validation
- `files/devhub-ops.conf`: desired configuration

## Apply
Run from the DevHub repository root:

    sudo salt-call --local --file-root="$PWD/salt" state.apply states.devhub

## Verify
Inspect the managed file:

    cat /tmp/devhub-ops.conf

Expected settings:
- `APP_NAME=DevHub`
- `CONFIG_MANAGED_BY=SaltStack`

## Safety
This integration does not manage credentials, Kubernetes Secrets, running
containers, or application deployment resources.
