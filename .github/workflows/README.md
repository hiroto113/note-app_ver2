# GitHub Actions Workflows

This directory contains GitHub Actions workflow configuration files for CI/CD pipelines.

## Structure

Place your workflow YAML files directly in this directory. GitHub Actions will automatically detect and run workflows defined here.

Example workflow files:
- `ci.yml` - Continuous Integration workflow
- `deploy.yml` - Deployment workflow
- `test.yml` - Test automation workflow

## Workflow File Format

Workflow files must:
- Be in YAML format
- Have a `.yml` or `.yaml` extension
- Be placed directly in the `.github/workflows/` directory

For more information, see the [GitHub Actions documentation](https://docs.github.com/en/actions).