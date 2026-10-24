devhub_salt_status_file:
  file.managed:
    - name: /tmp/devhub-salt-status.txt
    - user: root
    - group: root
    - mode: '0644'
    - contents: |
        DevHub SaltStack integration is active.
        Managed by SaltStack.

devhub_ops_config:
  file.managed:
    - name: /tmp/devhub-ops.conf
    - source: salt://files/devhub-ops.conf
    - user: root
    - group: root
    - mode: '0644'

devhub_ops_config_validation:
  cmd.run:
    - name: grep -q '^APP_NAME=DevHub$' /tmp/devhub-ops.conf && grep -q '^CONFIG_MANAGED_BY=SaltStack$' /tmp/devhub-ops.conf
    - unless: grep -q '^APP_NAME=DevHub$' /tmp/devhub-ops.conf && grep -q '^CONFIG_MANAGED_BY=SaltStack$' /tmp/devhub-ops.conf
    - require:
      - file: devhub_ops_config
